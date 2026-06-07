const path = require("path");
const __basedir = path.resolve(__dirname, "..");

// Static requires for nft tracing — needed for dynamic require(path.join(...)) below
require("reflect-metadata");
require("@nestjs/common");
require("@nestjs/core");
require("@nestjs/config");
require("@nestjs/swagger");
require("@nestjs/platform-express");
require("helmet");
require("@prisma/client");

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

  if (req.method === "GET" && req.url && req.url.includes("/bot/status")) {
    return send(200, { status: "bypass_ok" });
  }

  if (!app) {
    let mod;
    try {
      mod = require(path.join(__basedir, "dist", "main"));
    } catch (e) {
      return send(500, { error: "load_failed", message: e.message, code: e.code });
    }
    try {
      app = await mod.createApp();
      await app.init();
    } catch (e) {
      return send(500, { error: "init_failed", message: e.message });
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
