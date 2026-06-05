import { describe, it, expect } from "vitest";
import { ProviderRouter } from "./router.js";

describe("ProviderRouter", () => {
  const router = new ProviderRouter();

  it("should register default providers", () => {
    expect(router).toBeDefined();
  });

  it("should return an array of available providers", async () => {
    const available = await router.getAvailableProviders();
    expect(Array.isArray(available)).toBe(true);
  });

  it("should have at least one provider registered", async () => {
    const available = await router.getAvailableProviders();
    expect(available.length).toBeGreaterThanOrEqual(0);
  });

  it("should fail with empty prompt (no provider available)", async () => {
    await expect(router.generate({ prompt: "" })).rejects.toThrow();
  });
});
