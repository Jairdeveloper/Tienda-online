import { describe, it, expect, afterAll } from "vitest";
import express from "express";
import { createHealthRouter } from "./health.js";
import { createServer } from "node:http";

describe("GET /health", () => {
  const app = express();
  app.use("/health", createHealthRouter());
  const server = createServer(app);

  afterAll(() => {
    server.close();
  });

  it("should return ok status", async () => {
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 4002;
    const response = await fetch(`http://localhost:${port}/health`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("uptime");
  });
});
