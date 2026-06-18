export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ILLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
}

export interface DecisionClassification {
  decisionType: string;
  title: string;
  options: string[];
  recommendedExperts: ExpertRole[];
}

export interface ExpertRole {
  role: string;
  name: string;
  priority: number;
}

export interface ExpertAnalysis {
  role: string;
  name: string;
  summary: string;
  score: Record<string, number>;
}

export interface DebateResult {
  expertOpinions: {
    expert: string;
    stance: string;
    score: number;
    reasoning: string;
  }[];
  consensus: string;
  divergence: string;
  coachQuestion: string;
}

export interface DecisionReport {
  scoresJson: string;
  coreConflict: string;
  strategy: string;
  actionItems: string;
}