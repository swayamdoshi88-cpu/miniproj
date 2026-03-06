
export interface AnalysisResult {
  deceptionProbability: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'hostile' | 'anxious';
  stressLevel: number; // 0 to 100
  markers: string[];
  summary: string;
  confidence: number;
  transcription: string;
}

export enum SessionStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface MarkerInfo {
  type: string;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}
