const path = require("path");

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

let app;

module.exports = async (req, res) => {
  const send = (status, body) => {
    try {
      if (!res.headersSent) {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(body));
      }
    } catch (_) {
      try { res.end("{}"); } catch (_) {}
    }
  };

  // Use 200 for all responses (including errors) because Vercel Hobby
  // intercepts 5xx bodies and replaces them with generic HTML pages.
  const respond = (body) => send(200, body);

  if (req.method === "GET" && req.url && req.url.includes("/bot/status")) {
    return send(200, { status: "bypass_ok" });
  }

  if (!app) {
    try {
      const { ExpressAdapter } = require("@nestjs/platform-express");
      const { createApp } = require(path.join(__dirname, "..", "dist", "main"));

      const adapter = new ExpressAdapter();
      app = await createApp(adapter);

      // Register a direct test route bypassing NestJS routing
      const instance = adapter.getInstance();
      instance.get("/direct-test", (_req2, _res2) => _res2.json({ status: "direct_ok" }));
    } catch (e) {
      return respond({
        error: "init_failed",
        message: e.message,
        stack: (e.stack || "").split("\n").slice(0, 5),
      });
    }
  }

  try {
    const instance = app.getHttpAdapter().getInstance();
    return new Promise((resolve) => {
      res.on("finish", () => resolve());
      instance(req, res);
    });
  } catch (e) {
    respond({ error: "dispatch_error", message: e.message });
  }
};
