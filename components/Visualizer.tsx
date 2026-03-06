
import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  isRecording: boolean;
  stream: MediaStream | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ isRecording, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode>();

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzerRef.current = analyzer;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (!ctx || !canvas) return;
      animationRef.current = requestAnimationFrame(draw);
      analyzer.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const hue = (i / bufferLength) * 360;
        
        ctx.fillStyle = isRecording 
          ? `hsla(${200 + (dataArray[i]/5)}, 100%, 60%, 0.8)` 
          : 'rgba(255, 255, 255, 0.1)';
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [stream, isRecording]);

  return (
    <div className="relative w-full h-32 rounded-lg overflow-hidden glass border border-emerald-500/20">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        width={600}
        height={128}
      />
      {isRecording && <div className="scanner-line" />}
    </div>
  );
};

export default Visualizer;
