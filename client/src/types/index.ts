export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'coach' | 'expert' | 'system';
  expertRole?: string;
  phase: string;
  content: string;
  createdAt: string;
}

export interface Expert {
  id: string;
  role: string;
  name: string;
  summary?: string;
  score?: string;
}

export interface Session {
  id: string;
  title?: string;
  decisionType?: string;
  status: string;
  messages: Message[];
  experts: Expert[];
  report?: Report;
}

export interface Report {
  id: string;
  sessionId: string;
  scoresJson?: string;
  coreConflict?: string;
  strategy?: string;
  actionItems?: string;
}

export interface ScoreItem {
  expert: string;
  option: string;
  score: number;
}

export interface ActionItem {
  action: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
}

export type Phase = 'identification' | 'interview' | 'debate' | 'report' | 'completed';

export interface ExpertRole {
  role: string;
  name: string;
  priority: number;
}

export interface DecisionClassification {
  decisionType: string;
  title: string;
  options: string[];
  recommendedExperts: ExpertRole[];
}