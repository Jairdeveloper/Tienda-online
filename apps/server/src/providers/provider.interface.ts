import type { AIRequest, AIResponse, ChatRequest, ChatResponse, ProviderConfig } from "../types.js";

export abstract class AIProvider {
  public readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract generate(req: AIRequest): Promise<AIResponse>;
  abstract chat(req: ChatRequest): Promise<ChatResponse>;
  abstract isAvailable(): Promise<boolean>;
}
