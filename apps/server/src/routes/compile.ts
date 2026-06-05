import { Router } from "express";
import type { ProviderRouter } from "../providers/router.js";
import type { CompileRequest, CompileResponse } from "../types.js";

let currentCycle = 0;

export function createCompileRouter(providerRouter: ProviderRouter): Router {
  const r = Router();

  r.post("/", async (req, res, next) => {
    try {
      const body = req.body as CompileRequest;

      if (!body.instruction) {
        res.status(400).json({ error: "instruction is required" });
        return;
      }

      currentCycle++;
      const cycle = currentCycle;

      const prompt = buildCompilePrompt(body.instruction, body.context);
      const aiResult = await providerRouter.generate({
        prompt,
        provider: body.provider,
        system: "Eres un compilador de lenguaje natural a acciones. Analiza la instruccion y genera un IR (Intermediate Representation) estructurado.",
      });

      const response: CompileResponse = {
        cycle,
        ir: {
          goal: body.instruction,
          tokens: [],
          actions: [{ verb: "analyze", target: body.instruction, domain: "general", constraints: [] }],
          confidence: 0.5,
          metadata: { raw: aiResult.generated },
        },
        tac: [
          { op: "PARSE", arg1: body.instruction, arg2: "", result: "tokens" },
          { op: "ANALYZE", arg1: "tokens", arg2: "symbols", result: "ast" },
          { op: "SYNTHESIZE", arg1: "ast", arg2: "profile", result: "actions" },
        ],
        synthesis: {
          type: "proposal",
          content: aiResult.generated,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  return r;
}

function buildCompilePrompt(instruction: string, context?: string): string {
  let prompt = `Instruccion: ${instruction}\n\n`;
  if (context) {
    prompt += `Contexto:\n${context}\n\n`;
  }
  prompt += "Genera un analisis estructurado con: objetivo, acciones necesarias, archivos involucrados, y pasos de ejecucion.";
  return prompt;
}
