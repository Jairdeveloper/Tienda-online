// Diagnostic endpoint — tests NestJS loading without Prisma
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
      info.distFiles = fs.readdirSync(distDir).slice(0, 30);
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

    info.stage = "try_load_main";
    try {
      const m = require(path.join(basedir, "dist", "main"));
      info.mainLoaded = true;
      info.hasCreateApp = typeof m.createApp === "function";
    } catch (e) {
      info.mainLoaded = false;
      info.mainError = e.message;
      info.mainCode = e.code;
    }

    info.stage = "done";
    res.status(200).json(info);
  } catch (e) {
    res.status(500).json({ stage: info.stage, error: e.message, stack: e.stack?.split("\n").slice(0, 5) });
  }
};
