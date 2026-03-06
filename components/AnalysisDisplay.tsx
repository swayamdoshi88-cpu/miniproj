
import React from 'react';
import { AnalysisResult } from '../types';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  const getProbabilityColor = (prob: number) => {
    if (prob < 30) return 'text-emerald-400';
    if (prob < 60) return 'text-yellow-400';
    return 'text-rose-500';
  };

  const getProbabilityBg = (prob: number) => {
    if (prob < 30) return 'bg-emerald-400/20';
    if (prob < 60) return 'bg-yellow-400/20';
    return 'bg-rose-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-6 rounded-2xl glass border border-white/10 flex flex-col items-center justify-center text-center`}>
          <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">Deception Prob.</span>
          <div className={`text-5xl font-bold mb-1 ${getProbabilityColor(result.deceptionProbability)}`}>
            {result.deceptionProbability}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${result.deceptionProbability > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${result.deceptionProbability}%` }}
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl glass border border-white/10 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">Stress Index</span>
          <div className="text-4xl font-bold text-cyan-400">
            {result.stressLevel}<span className="text-lg opacity-50">/100</span>
          </div>
          <span className="text-xs text-slate-500 mt-2 italic">Based on pitch & jitter</span>
        </div>

        <div className="p-6 rounded-2xl glass border border-white/10 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">Sentiment</span>
          <div className="text-2xl font-bold capitalize text-white">
            {result.sentiment}
          </div>
          <span className="text-xs text-slate-500 mt-2 italic">Linguistic affect</span>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <i className="fas fa-brain text-purple-400"></i>
          Psycholinguistic Summary
        </h3>
        <p className="text-slate-200 leading-relaxed">
          {result.summary}
        </p>
      </div>

      <div className="p-6 rounded-2xl glass border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <i className="fas fa-quote-left text-cyan-400"></i>
          Transcription
        </h3>
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-300 mono text-sm">
          "{result.transcription}"
        </div>
      </div>

      <div className="p-6 rounded-2xl glass border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <i className="fas fa-fingerprint text-emerald-400"></i>
          Detected Markers
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.markers.map((marker, idx) => (
            <span key={idx} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300">
              {marker}
            </span>
          ))}
          {result.markers.length === 0 && (
            <span className="text-slate-500 text-sm italic">No significant markers detected.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
