
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SessionStatus } from './types';
import Visualizer from './components/Visualizer';
import AnalysisDisplay from './components/AnalysisDisplay';
import { float32ToInt16, encodeToBase64 } from './services/audioUtils';

const App: React.FC = () => {
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startAnalysis = async () => {
    try {
      setError(null);
      setResult(null);
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      setStatus(SessionStatus.RECORDING);

      const recorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await performDeepAnalysis(audioBlob);
      };

      recorder.start();
    } catch (err: any) {
      setError("Microphone access denied or error occurred.");
      setStatus(SessionStatus.ERROR);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === SessionStatus.RECORDING) {
      mediaRecorderRef.current.stop();
      stream?.getTracks().forEach(track => track.stop());
      setStatus(SessionStatus.ANALYZING);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const performDeepAnalysis = async (audioBlob: Blob) => {
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: base64Audio
                }
              },
              {
                text: "Analyze the provided audio for signs of deception, stress, and sentiment. Look for psycholinguistic markers like micro-hesitations, pitch jitter, speech speed variations, and word choice patterns (e.g., distancing language, over-explaining). Return the result strictly in JSON format matching the schema."
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              deceptionProbability: { type: Type.NUMBER, description: "Probability of deception from 0 to 100" },
              sentiment: { type: Type.STRING, description: "Overall sentiment of the speech" },
              stressLevel: { type: Type.NUMBER, description: "Calculated stress level from 0 to 100" },
              markers: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of specific indicators detected" 
              },
              summary: { type: Type.STRING, description: "A detailed psycholinguistic summary of the analysis" },
              confidence: { type: Type.NUMBER, description: "AI confidence score from 0 to 100" },
              transcription: { type: Type.STRING, description: "Full transcription of the audio" }
            },
            required: ["deceptionProbability", "sentiment", "stressLevel", "markers", "summary", "confidence", "transcription"]
          }
        }
      });

      const analysisData: AnalysisResult = JSON.parse(response.text.trim());
      setResult(analysisData);
      setStatus(SessionStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Please try again with a clearer audio sample.");
      setStatus(SessionStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <i className="fas fa-shield-halved text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">VERITAS <span className="text-emerald-500">AI</span></h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Deception Analysis Protocol</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-slate-400 font-semibold">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live
          </span>
          <span className="flex items-center gap-2">
            <i className="fas fa-lock"></i>
            Encrypted
          </span>
        </div>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        {/* Stage 1: Control Panel */}
        <section className="p-8 rounded-3xl glass relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${
              status === SessionStatus.IDLE ? 'border-slate-700 text-slate-500' :
              status === SessionStatus.RECORDING ? 'border-rose-500 text-rose-500 animate-pulse' :
              status === SessionStatus.ANALYZING ? 'border-cyan-500 text-cyan-500' :
              'border-emerald-500 text-emerald-500'
            }`}>
              {status}
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 py-4">
            <div className="text-center max-w-md">
              <h2 className="text-3xl font-bold text-white mb-3">Begin Interrogation</h2>
              <p className="text-slate-400 text-sm">
                Speak clearly into your microphone. Our neural networks will analyze vocal tension, sentiment consistency, and linguistic distancing.
              </p>
            </div>

            <Visualizer isRecording={status === SessionStatus.RECORDING} stream={stream} />

            <div className="flex items-center gap-4">
              {status === SessionStatus.IDLE || status === SessionStatus.COMPLETED || status === SessionStatus.ERROR ? (
                <button 
                  onClick={startAnalysis}
                  className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12"></div>
                  <i className="fas fa-microphone text-lg"></i>
                  Start Recording
                </button>
              ) : status === SessionStatus.RECORDING ? (
                <button 
                  onClick={stopRecording}
                  className="px-8 py-4 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 animate-pulse"
                >
                  <i className="fas fa-stop text-lg"></i>
                  End & Analyze
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                  <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest animate-pulse">Running Neural Inference...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stage 2: Results */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
            <i className="fas fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        {result && <AnalysisDisplay result={result} />}

        {!result && status === SessionStatus.IDLE && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 text-center">
              <i className="fas fa-wave-square text-emerald-500 mb-3 text-2xl"></i>
              <h4 className="text-white font-bold text-sm mb-1">Stress Analysis</h4>
              <p className="text-xs text-slate-500">Sub-vocal tension detection</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 text-center">
              <i className="fas fa-brain text-purple-500 mb-3 text-2xl"></i>
              <h4 className="text-white font-bold text-sm mb-1">Cognitive Load</h4>
              <p className="text-xs text-slate-500">Hesitation & processing lag</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 text-center">
              <i className="fas fa-font text-cyan-500 mb-3 text-2xl"></i>
              <h4 className="text-white font-bold text-sm mb-1">Sentiment Link</h4>
              <p className="text-xs text-slate-500">Linguistic affect alignment</p>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-center text-slate-600 text-[10px] uppercase tracking-[0.3em] font-medium">
        &copy; 2024 Veritas Neural Systems &bull; Experimental Deception Protocol
      </footer>
    </div>
  );
};

export default App;
