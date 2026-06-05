import { spawn } from "node:child_process";
import { AIProvider } from "./provider.interface.js";
import type { AIRequest, AIResponse, ChatRequest, ChatResponse, ProviderConfig } from "../types.js";

export class OpenCodeProvider extends AIProvider {
  constructor(config: Partial<ProviderConfig> = {}) {
    super({
      name: "opencode",
      model: config.model || "big-pickle",
      ...config,
    });
  }

  async generate(req: AIRequest): Promise<AIResponse> {
    const prompt = this.buildPrompt(req);
    const output = await this.runOpenCode(prompt);

    return {
      generated: output,
      provider: "opencode",
      model: this.config.model || "big-pickle",
    };
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const prompt = req.messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    const output = await this.runOpenCode(prompt);

    return {
      message: { role: "assistant", content: output },
      provider: "opencode",
      model: this.config.model || "big-pickle",
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { promises } = await import("node:fs");
      const { access } = promises;
      const result = await Promise.race([
        access("/usr/local/bin/opencode").then(() => true).catch(() => false),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 500)),
      ]);
      return result;
    } catch {
      return false;
    }
  }

  private buildPrompt(req: AIRequest): string {
    let prompt = "";
    if (req.system) {
      prompt += `${req.system}\n\n`;
    }
    prompt += req.prompt;
    return prompt;
  }

  private runOpenCode(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("opencode", ["--model", this.config.model || "big-pickle", "--quiet"], {
        stdio: ["pipe", "pipe", "pipe"],
        timeout: this.config.timeout || 60000,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0 && stdout) {
          resolve(stdout.trim());
        } else if (stdout) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`opencode exited with code ${code}: ${stderr}`));
        }
      });

      proc.on("error", (err) => {
        reject(new Error(`Failed to spawn opencode: ${err.message}`));
      });

      proc.stdin.write(prompt);
      proc.stdin.end();
    });
  }
}
