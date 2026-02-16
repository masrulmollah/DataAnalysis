
export interface DataAnalysisResult {
  summary: string;
  keyInsights: string[];
  suggestions: string[];
  chartData: Array<{
    name: string;
    value: number;
    category?: string;
  }>;
  statistics: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface FileData {
  name: string;
  content: string;
  type: string;
}
