import { AIProvider } from "./provider.interface.js";
import { OpenCodeProvider } from "./opencode.provider.js";
import { OpenAIProvider } from "./openai.provider.js";
import { AnthropicProvider } from "./anthropic.provider.js";
import type { AIRequest, AIResponse, ChatRequest, ChatResponse, ProviderName } from "../types.js";

export class ProviderRouter {
  private providers: Map<ProviderName, AIProvider> = new Map();
  private fallbackChain: ProviderName[] = ["opencode", "openai", "anthropic"];

  constructor() {
    this.register("opencode", new OpenCodeProvider());
    this.register("openai", new OpenAIProvider({ apiKey: process.env.OPENAI_KEY }));
    this.register("anthropic", new AnthropicProvider({ apiKey: process.env.ANTHROPIC_KEY }));
  }

  register(name: ProviderName, provider: AIProvider): void {
    this.providers.set(name, provider);
  }

  async generate(req: AIRequest): Promise<AIResponse> {
    const preferred = req.provider || (process.env.AI_PROVIDER as ProviderName) || "opencode";
    const errors: string[] = [];

    const order = this.buildOrder(preferred);

    for (const name of order) {
      const provider = this.providers.get(name);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) {
          errors.push(`${name}: not available`);
          continue;
        }

        return await provider.generate(req);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${name}: ${msg}`);
      }
    }

    throw new Error(`All providers failed:\n${errors.join("\n")}`);
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const preferred = req.provider || (process.env.AI_PROVIDER as ProviderName) || "opencode";
    const errors: string[] = [];

    const order = this.buildOrder(preferred);

    for (const name of order) {
      const provider = this.providers.get(name);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available) {
          errors.push(`${name}: not available`);
          continue;
        }

        return await provider.chat(req);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${name}: ${msg}`);
      }
    }

    throw new Error(`All providers failed:\n${errors.join("\n")}`);
  }

  async getAvailableProviders(): Promise<ProviderName[]> {
    const available: ProviderName[] = [];

    for (const [name, provider] of this.providers) {
      try {
        if (await provider.isAvailable()) {
          available.push(name);
        }
      } catch {
        continue;
      }
    }

    return available;
  }

  private buildOrder(preferred: ProviderName): ProviderName[] {
    const order: ProviderName[] = [preferred];
    for (const name of this.fallbackChain) {
      if (name !== preferred) {
        order.push(name);
      }
    }
    return order;
  }
}
