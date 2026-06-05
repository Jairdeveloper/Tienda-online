export type ProviderName = "opencode" | "openai" | "anthropic";

export interface AIRequest {
  prompt: string;
  provider?: ProviderName;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  generated: string;
  provider: ProviderName;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  provider?: ProviderName;
  temperature?: number;
}

export interface ChatResponse {
  message: ChatMessage;
  provider: ProviderName;
  model: string;
}

export interface ProviderConfig {
  name: ProviderName;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface TrainingExample {
  id: string;
  timestamp: string;
  source: string;
  type: "example" | "naming" | "correction";
  content: unknown;
  result?: string;
}

export interface Profile {
  name: string;
  defaultProvider: ProviderName;
  preferredModes: string[];
  frequentActions: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface CompileRequest {
  instruction: string;
  context?: string;
  provider?: ProviderName;
}

export interface CompileResponse {
  cycle: number;
  ir: IntermediateRepresentation;
  tac: ThreeAddressCode[];
  synthesis: Synthesis;
}

export interface IntermediateRepresentation {
  goal: string;
  tokens: Token[];
  actions: Action[];
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface Token {
  type: string;
  value: string;
  position: number;
}

export interface Action {
  verb: string;
  target: string;
  domain: string;
  constraints: string[];
}

export interface ThreeAddressCode {
  op: string;
  arg1: string;
  arg2: string;
  result: string;
}

export interface Synthesis {
  type: "proposal" | "plan" | "command";
  content: string;
}
