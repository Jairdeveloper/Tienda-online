import express from "express";
import cors from "cors";
import helmet from "helmet";
import { loadConfig } from "./config.js";
import { ProviderRouter } from "./providers/router.js";
import { createHealthRouter } from "./routes/health.js";
import { createAiRouter } from "./routes/ai.js";
import { createCompileRouter } from "./routes/compile.js";
import { createTrainingRouter } from "./routes/training.js";
import { createProfileRouter } from "./routes/profile.js";

const config = loadConfig();
const app = express();
const providerRouter = new ProviderRouter();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.use((req, _res, next) => {
  if (config.logLevel === "debug") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

app.use("/health", createHealthRouter());
app.use("/ai", createAiRouter(providerRouter));
app.use("/compile", createCompileRouter(providerRouter));
app.use("/training", createTrainingRouter(config.workflowDir));
app.use("/profile", createProfileRouter(config.workflowDir));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({
    error: err.message,
    timestamp: new Date().toISOString(),
  });
});

app.listen(config.port, config.host, () => {
  console.log(`[server] Prompt OS HTTP Server running on ${config.host}:${config.port}`);
  console.log(`[server] Default AI provider: ${config.defaultProvider}`);
  console.log(`[server] Workflow dir: ${config.workflowDir}`);
  console.log(`[server] Health: http://localhost:${config.port}/health`);
});
