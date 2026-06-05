import { AIProvider } from "./provider.interface.js";
import type { AIRequest, AIResponse, ChatRequest, ChatResponse, ProviderConfig } from "../types.js";

interface OpenAICompletionChoice {
  message: { content: string };
  finish_reason: string;
}

interface OpenAICompletionResponse {
  id: string;
  choices: OpenAICompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenAIProvider extends AIProvider {
  private baseUrl: string;

  constructor(config: Partial<ProviderConfig> = {}) {
    super({
      name: "openai",
      model: config.model || "gpt-4o",
      apiKey: config.apiKey || "",
      ...config,
    });

    if (!this.config.apiKey) {
      console.warn("[openai] No API key configured — provider will be unavailable");
    }

    this.baseUrl = this.config.baseUrl || "https://api.openai.com/v1";
  }

  async generate(req: AIRequest): Promise<AIResponse> {
    const messages: Array<{ role: string; content: string }> = [];

    if (req.system) {
      messages.push({ role: "system", content: req.system });
    }

    messages.push({ role: "user", content: req.prompt });

    const body = {
      model: this.config.model || "gpt-4o",
      messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2048,
    };

    const data = await this.post<OpenAICompletionResponse>("/chat/completions", body);

    return {
      generated: data.choices[0]?.message?.content || "",
      provider: "openai",
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const body = {
      model: this.config.model || "gpt-4o",
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? 0.7,
    };

    const data = await this.post<OpenAICompletionResponse>("/chat/completions", body);

    return {
      message: { role: "assistant", content: data.choices[0]?.message?.content || "" },
      provider: "openai",
      model: data.model,
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }
}
