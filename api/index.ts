import type { Request, Response } from "express";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import { createApp } from "../src/main";

let server: express.Express;

export default async function handler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!server) {
    const app = express();
    const adapter = new ExpressAdapter(app);
    const nestApp = await createApp(adapter);
    await nestApp.init();
    server = app;
  }

  server(req, res);
}
