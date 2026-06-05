import { Router } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Profile } from "../types.js";

export function createProfileRouter(workflowDir: string): Router {
  const r = Router();
  const profileDir = join(workflowDir, "profile");
  const profileFile = join(profileDir, "default.yml");

  function ensureProfileDir(): void {
    if (!existsSync(profileDir)) {
      mkdirSync(profileDir, { recursive: true });
    }
  }

  function getDefaultProfile(): Profile {
    return {
      name: "default",
      defaultProvider: "opencode",
      preferredModes: ["full", "analyze", "propose"],
      frequentActions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  r.get("/", (_req, res) => {
    ensureProfileDir();

    if (!existsSync(profileFile)) {
      const defaultProfile = getDefaultProfile();
      writeFileSync(profileFile, JSON.stringify(defaultProfile, null, 2), "utf-8");
      res.json(defaultProfile);
      return;
    }

    try {
      const content = readFileSync(profileFile, "utf-8");
      const profile = JSON.parse(content) as Profile;
      res.json(profile);
    } catch {
      const defaultProfile = getDefaultProfile();
      res.json(defaultProfile);
    }
  });

  r.post("/", (req, res) => {
    ensureProfileDir();

    const existing: Profile = existsSync(profileFile)
      ? JSON.parse(readFileSync(profileFile, "utf-8"))
      : getDefaultProfile();

    const updates = req.body as Partial<Profile>;
    const updated: Profile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeFileSync(profileFile, JSON.stringify(updated, null, 2), "utf-8");
    res.json(updated);
  });

  return r;
}
