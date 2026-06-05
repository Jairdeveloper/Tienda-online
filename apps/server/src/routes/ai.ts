import { Router } from "express";
import type { ProviderRouter } from "../providers/router.js";
import type { AIRequest, ChatRequest } from "../types.js";

export function createAiRouter(router: ProviderRouter): Router {
  const r = Router();

  r.post("/generate", async (req, res, next) => {
    try {
      const body = req.body as AIRequest;

      if (!body.prompt) {
        res.status(400).json({ error: "prompt is required" });
        return;
      }

      const result = await router.generate(body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  r.post("/chat", async (req, res, next) => {
    try {
      const body = req.body as ChatRequest;

      if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
        res.status(400).json({ error: "messages array is required" });
        return;
      }

      const result = await router.chat(body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  r.get("/providers", async (_req, res, next) => {
    try {
      const available = await router.getAvailableProviders();
      res.json({ providers: available });
    } catch (err) {
      next(err);
    }
  });

  return r;
}
