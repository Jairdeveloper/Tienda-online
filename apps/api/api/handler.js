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

  if (!app) {
    try {
      const core = require("@nestjs/core");
      const common = require("@nestjs/common");
      const { ExpressAdapter } = require("@nestjs/platform-express");
      const { AppModule } = require(path.join(__dirname, "..", "dist", "app.module"));

      const adapter = new ExpressAdapter();
      const nestApp = await core.NestFactory.create(AppModule, adapter, { bufferLogs: true });
      app = nestApp;
    } catch (e) {
      return send(500, { error: "init_failed", message: e.message, type: e.constructor?.name, stack: (e.stack || "").split("\n").slice(0, 5) });
    }
  }

  try {
    const instance = app.getHttpAdapter().getInstance();
    return new Promise((resolve) => {
      res.on("finish", () => resolve());
      instance(req, res);
    });
  } catch (e) {
    send(500, { error: "dispatch_error", message: e.message });
  }
};
