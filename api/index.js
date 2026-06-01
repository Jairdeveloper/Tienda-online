const prismaModule = require("@prisma/client");
const OrigPrismaClient = prismaModule.PrismaClient;

prismaModule.PrismaClient = new Proxy(OrigPrismaClient, {
  construct(target, args) {
    const opts = args[0] || {};
    opts.__internal = opts.__internal || {};
    const origOverride = opts.__internal.configOverride;
    opts.__internal.configOverride = (cfg) => {
      let result = origOverride ? origOverride(cfg) : { ...cfg };
      result.postinstall = false;
      result.ciName = undefined;
      return result;
    };
    args[0] = opts;
    return Reflect.construct(target, args);
  },
});

const path = require("path");

let app;
let initError;
let mod;

try {
  mod = require("../dist/main");
} catch (_) {
  try {
    mod = require("./dist/main");
  } catch (err2) {
    initError = new Error(
      `Cannot find dist/main. Tried: ${path.join(__dirname, "..", "dist", "main")}, ${path.join(__dirname, "dist", "main")}`,
    );
  }
}

process.on("uncaughtException", (err) => {
  console.error(
    "UNCAUGHT:",
    err.message,
    err.stack?.split("\n").slice(0, 3).join(" | "),
  );
});
process.on("unhandledRejection", (err) => {
  console.error(
    "UNHANDLED:",
    err?.message || err,
    err?.stack?.split("\n").slice(0, 3).join(" | ") || "",
  );
});

module.exports = async (req, res) => {
  const start = Date.now();
  const log = (...args) => console.log(`[${Date.now() - start}ms]`, ...args);

  log("HANDLER_START", req.method, req.url);
  log("VERCEL:", process.env.VERCEL);
  log("NODE_VERSION:", process.version);
  log("DATABASE_URL_SET:", !!process.env.DATABASE_URL);
  log("REDIS_URL_SET:", !!process.env.REDIS_URL);

  try {
    if (initError) throw initError;

    if (!app) {
      log("CREATING_APP");
      app = await mod.createApp();
      log("APP_CREATED");

      log("INIT_APP");
      await app.init();
      log("APP_INITIALIZED");
    }

    log("DISPATCHING");
    const expressInstance = app.getHttpAdapter().getInstance();

    return new Promise((resolve) => {
      res.on("finish", () => {
        log("RESPONSE_FINISHED", res.statusCode);
        resolve();
      });
      expressInstance(req, res);
    });
  } catch (err) {
    console.error(
      "HANDLER_ERROR:",
      err.message,
      err.stack?.split("\n").slice(0, 5).join(" | "),
    );
    if (!res.headersSent) {
      try {
        res.status(500).json({
          error: "init_failed",
          message: err.message,
          stack: err.stack?.split("\n").slice(0, 5),
        });
      } catch (e) {
        res.end("ERROR: " + err.message);
      }
    }
  }
};
