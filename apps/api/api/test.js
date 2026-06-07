const path = require("path");
const basedir = path.resolve(__dirname, "..");

module.exports = async (req, res) => {
  const info = { stage: "start" };
  try {
    info.stage = "set_env";
    if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
      process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
    }

    info.stage = "check_dist";
    const fs = require("fs");
    const distDir = path.join(basedir, "dist");
    info.distExists = fs.existsSync(distDir);
    if (info.distExists) {
      info.distFiles = fs.readdirSync(distDir);
    }

    info.stage = "check_prisma_env";
    info.prismaEngine = process.env.PRISMA_CLIENT_ENGINE_TYPE;
    info.vercel = !!process.env.VERCEL;

    info.stage = "try_load_prisma";
    try {
      const pm = require("@prisma/client");
      info.prismaLoaded = true;
      info.prismaVersion = pm.PrismaClient?.name || "unknown";
    } catch (e) {
      info.prismaLoaded = false;
      info.prismaError = e.message;
    }

    info.stage = "try_load_prisma_module";
    try {
      const pm2 = require(path.join(basedir, "dist", "prisma", "prisma.module"));
      info.prismaModuleLoaded = true;
      info.prismaModuleType = typeof pm2.PrismaModule;
      info.prismaModuleKeys = Object.keys(pm2);
    } catch (e) {
      info.prismaModuleLoaded = false;
      info.prismaModuleError = e.message;
      info.prismaModuleErrorType = e.constructor?.name;
    }

    info.stage = "try_load_app_module";
    try {
      const am2 = require(path.join(basedir, "dist", "app.module"));
      info.appModuleLoaded = true;
    } catch (e) {
      info.appModuleLoaded = false;
      info.appModuleError = e.message;
      info.appModuleErrorType = e.constructor?.name;
      info.appModuleErrorStack = (e.stack || "").split("\n").slice(0, 5);
    }

    info.stage = "try_load_main";
    try {
      const m = require(path.join(basedir, "dist", "main"));
      info.mainLoaded = true;
      info.hasCreateApp = typeof m.createApp === "function";
    } catch (e) {
      info.mainLoaded = false;
      info.mainError = e.message;
      info.mainErrorType = e.constructor?.name;
      info.mainCode = e.code;
      info.mainStack = (e.stack || "").split("\n").slice(0, 5);
    }

    info.stage = "try_create_app";
    try {
      const m = require(path.join(basedir, "dist", "main"));
      const a = await m.createApp();
      info.createAppOk = true;
      info.stage = "try_init_app";
      try {
        await a.init();
        info.initAppOk = true;
      } catch (e) {
        info.initAppError = e.message;
      }
    } catch (e) {
      info.createAppError = e.message;
    }

    info.stage = "done";
    res.status(200).json(info);
  } catch (e) {
    res.status(500).json({ stage: info.stage, error: e.message, stack: e.stack?.split("\n").slice(0, 5) });
  }
};
