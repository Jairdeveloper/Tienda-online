import { Router } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { TrainingExample } from "../types.js";

export function createTrainingRouter(workflowDir: string): Router {
  const r = Router();
  const trainingFile = join(workflowDir, "training", "examples.jsonl");

  function ensureTrainingFile(): void {
    const dir = join(workflowDir, "training");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    if (!existsSync(trainingFile)) {
      writeFileSync(trainingFile, "", "utf-8");
    }
  }

  r.get("/", (_req, res) => {
    ensureTrainingFile();

    if (!existsSync(trainingFile)) {
      res.json({ examples: [] });
      return;
    }

    const content = readFileSync(trainingFile, "utf-8").trim();
    if (!content) {
      res.json({ examples: [] });
      return;
    }

    const examples: TrainingExample[] = content
      .split("\n")
      .filter((l) => l.trim())
      .map((line) => JSON.parse(line));

    res.json({ examples });
  });

  r.post("/example", (req, res) => {
    const body = req.body as Partial<TrainingExample>;

    if (!body.source || !body.content) {
      res.status(400).json({ error: "source and content are required" });
      return;
    }

    ensureTrainingFile();

    const example: TrainingExample = {
      id: body.id || `example_${Date.now()}`,
      timestamp: body.timestamp || new Date().toISOString(),
      source: body.source,
      type: body.type || "example",
      content: body.content,
      result: body.result,
    };

    writeFileSync(trainingFile, JSON.stringify(example) + "\n", { flag: "a", encoding: "utf-8" });

    res.status(201).json(example);
  });

  return r;
}
