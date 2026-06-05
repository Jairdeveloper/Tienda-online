import { AIProvider } from "./provider.interface.js";
import type { AIRequest, AIResponse, ChatRequest, ChatResponse, ProviderConfig } from "../types.js";

interface AnthropicContent {
  type: string;
  text: string;
}

interface AnthropicMessage {
  role: string;
  content: AnthropicContent[];
}

interface AnthropicResponse {
  id: string;
  model: string;
  content: AnthropicContent[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider extends AIProvider {
  private baseUrl: string;

  constructor(config: Partial<ProviderConfig> = {}) {
    super({
      name: "anthropic",
      model: config.model || "claude-sonnet-4-20250514",
      apiKey: config.apiKey || "",
      ...config,
    });

    if (!this.config.apiKey) {
      console.warn("[anthropic] No API key configured — provider will be unavailable");
    }

    this.baseUrl = this.config.baseUrl || "https://api.anthropic.com/v1";
  }

  async generate(req: AIRequest): Promise<AIResponse> {
    const system = req.system || undefined;

    const body: Record<string, unknown> = {
      model: this.config.model || "claude-sonnet-4-20250514",
      max_tokens: req.maxTokens ?? 2048,
      messages: [{ role: "user", content: req.prompt }],
    };

    if (system) {
      body.system = system;
    }

    const data = await this.post<AnthropicResponse>("/messages", body);

    const text = data.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    return {
      generated: text,
      provider: "anthropic",
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const body: Record<string, unknown> = {
      model: this.config.model || "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: req.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    };

    const data = await this.post<AnthropicResponse>("/messages", body);

    const text = data.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    return {
      message: { role: "assistant", content: text },
      provider: "anthropic",
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
        "x-api-key": this.config.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }
}
