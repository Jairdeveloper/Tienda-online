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

  if (req.method === "GET" && req.url && req.url.includes("/bot/status")) {
    return send(200, { status: "bypass_ok" });
  }

  if (!app) {
    try {
      const core = require("@nestjs/core");
      const common = require("@nestjs/common");
      const config = require("@nestjs/config");
      const { ExpressAdapter } = require("@nestjs/platform-express");
      const { SwaggerModule, DocumentBuilder } = require("@nestjs/swagger");
      const helmet = require("helmet");
      const { randomUUID } = require("crypto");

      const { AppModule } = require(path.join(__dirname, "..", "dist", "app.module"));
      const { HttpExceptionFilter } = require(path.join(__dirname, "..", "dist", "common", "filters", "http-exception.filter"));
      const { JsonLoggerService } = require(path.join(__dirname, "..", "dist", "common", "logger", "json-logger.service"));
      const { validationSchema } = require(path.join(__dirname, "..", "dist", "config", "env.validation"));

      const adapter = new ExpressAdapter();
      const nestApp = await core.NestFactory.create(AppModule, adapter, { bufferLogs: true });
      const configService = nestApp.get(config.ConfigService);
      const logger = nestApp.get(JsonLoggerService);
      nestApp.useLogger(logger);
      nestApp.use(helmet());
      nestApp.use((req2, res2, next) => {
        const requestIdHeader = req2.headers["x-request-id"];
        const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : (requestIdHeader ?? randomUUID());
        const startedAt = Date.now();
        req2.requestId = requestId;
        res2.setHeader("x-request-id", requestId);
        res2.on("finish", () => {
          logger.log({ event: "http_request", requestId, method: req2.method, path: req2.originalUrl, statusCode: res2.statusCode, durationMs: Date.now() - startedAt });
        });
        next();
      });
      const apiPrefix = configService.get("API_PREFIX", "api/v1");
      nestApp.setGlobalPrefix(apiPrefix);
      nestApp.useGlobalPipes(new common.ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
      nestApp.useGlobalFilters(new HttpExceptionFilter(logger));
      nestApp.enableShutdownHooks();
      const corsEnabled = configService.get("CORS_ENABLED", "true");
      if (["1", "true", "yes", "on"].includes((corsEnabled || "").toLowerCase())) {
        const origins = (configService.get("CORS_ORIGIN", "") || "").split(",").map((o) => o.trim()).filter(Boolean);
        nestApp.enableCors({ origin: origins.length > 0 ? origins : false, credentials: true });
      }
      const swaggerEnabled = configService.get("SWAGGER_ENABLED", "true");
      if (["1", "true", "yes", "on"].includes((swaggerEnabled || "").toLowerCase())) {
        const sc = new DocumentBuilder()
          .setTitle(configService.get("SWAGGER_TITLE", "Tienda API"))
          .setDescription(configService.get("SWAGGER_DESCRIPTION", "Backend Tienda Online"))
          .setVersion(configService.get("SWAGGER_VERSION", "1.0.0"))
          .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "bearer")
          .build();
        const document = SwaggerModule.createDocument(nestApp, sc);
        const swaggerPath = configService.get("SWAGGER_PATH", "docs");
        SwaggerModule.setup(apiPrefix + "/" + swaggerPath, nestApp, document);
      }
      const httpAdapter = nestApp.getHttpAdapter();
      const expressInstance = httpAdapter.getInstance();
      expressInstance.get("/direct-test", (_req2, _res2) => _res2.json({ status: "direct_ok" }));
      app = nestApp;
    } catch (e) {
      return send(500, { error: "init_failed", message: e.message, stack: (e.stack || "").split("\n").slice(0, 5) });
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
