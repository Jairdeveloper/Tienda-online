export interface ServerConfig {
  port: number;
  host: string;
  corsOrigin: string;
  logLevel: string;
  openaiKey: string;
  anthropicKey: string;
  defaultProvider: string;
  workflowDir: string;
}

function getEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export function loadConfig(): ServerConfig {
  return {
    port: parseInt(getEnv("PORT", "4001"), 10),
    host: getEnv("HOST", "0.0.0.0"),
    corsOrigin: getEnv("CORS_ORIGIN", "*"),
    logLevel: getEnv("LOG_LEVEL", "info"),
    openaiKey: getEnv("OPENAI_KEY", ""),
    anthropicKey: getEnv("ANTHROPIC_KEY", ""),
    defaultProvider: getEnv("AI_PROVIDER", "opencode"),
    workflowDir: getEnv("WORKFLOW_DIR", ".workflow"),
  };
}
