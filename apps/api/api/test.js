const path = require("path");
const basedir = path.resolve(__dirname, "..");

module.exports = async (req, res) => {
  const info = {};

  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  }
  info.engineType = process.env.PRISMA_CLIENT_ENGINE_TYPE;

  // 1: require dist/prisma/prisma.module directly (has || fallback fix)
  try {
    const pm = require(path.join(basedir, "dist", "prisma", "prisma.module"));
    info.m1_prismaModule = "ok";
    info.m1_keys = Object.keys(pm).join(",");
    info.m1_type = typeof pm.PrismaModule;
  } catch (e) {
    info.m1_prismaModule = "error";
    info.m1_err = e.message;
    info.m1_errType = e.constructor?.name;
    info.m1_stack = (e.stack || "").split("\n").slice(0, 3);
    return res.json(info);
  }

  // 2: require dist/app.module (loads all domain modules)
  try {
    const am = require(path.join(basedir, "dist", "app.module"));
    info.m2_appModule = "ok";
    info.m2_keys = Object.keys(am).join(",");
  } catch (e) {
    info.m2_appModule = "error";
    info.m2_err = e.message;
    info.m2_errType = e.constructor?.name;
    info.m2_stack = (e.stack || "").split("\n").slice(0, 5);
    return res.json(info);
  }

  // 3: require dist/main
  try {
    const m = require(path.join(basedir, "dist", "main"));
    info.m3_main = "ok";
    info.m3_hasCreate = typeof m.createApp;
  } catch (e) {
    info.m3_main = "error";
    info.m3_err = e.message;
    info.m3_errType = e.constructor?.name;
    info.m3_stack = (e.stack || "").split("\n").slice(0, 5);
    return res.json(info);
  }

  res.json(info);
};
