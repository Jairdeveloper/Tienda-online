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
      const config = require("@nestjs/config");
      const { ExpressAdapter } = require("@nestjs/platform-express");

      const { PrismaModule } = require(path.join(__dirname, "..", "dist", "prisma", "prisma.module"));
      const { RedisModule } = require(path.join(__dirname, "..", "dist", "redis", "redis.module"));
      const { CommonModule } = require(path.join(__dirname, "..", "dist", "common", "common.module"));

      // Build AppModule inline — no decorators
      class InlineAppModule {}
      common.Module({
        imports: [
          config.ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
          CommonModule,
          PrismaModule,
          RedisModule,
        ],
        providers: [],
      })(InlineAppModule);

      const adapter = new ExpressAdapter();
      const nestApp = await core.NestFactory.create(InlineAppModule, adapter, { bufferLogs: true });
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
