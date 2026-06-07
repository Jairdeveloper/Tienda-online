const path = require("path");
// Force nft to trace nestjs deps — needed because dynamic require() below
// isn't statically analyzable by Vercel's Node File Tracing.
require("@nestjs/common");
require("@nestjs/core");
require("@nestjs/config");
require("@nestjs/platform-express");
require("@nestjs/swagger");
require("@prisma/client");

module.exports = async (req, res) => {
  const info = {};

  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

  // 1: require dist/prisma/prisma.module
  try {
    const pm = require(path.join(__dirname, "..", "dist", "prisma", "prisma.module"));
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

  // 2: require dist/app.module
  try {
    const am = require(path.join(__dirname, "..", "dist", "app.module"));
    info.m2_appModule = "ok";
    info.m2_keys = Object.keys(am).join(",");
  } catch (e) {
    info.m2_appModule = "error";
    info.m2_err = e.message;
    info.m2_errType = e.constructor?.name;
    info.m2_stack = (e.stack || "").split("\n").slice(0, 3);
    return res.json(info);
  }

  // 3: require dist/main
  try {
    const m = require(path.join(__dirname, "..", "dist", "main"));
    info.m3_main = "ok";
    info.m3_hasCreate = typeof m.createApp;
  } catch (e) {
    info.m3_main = "error";
    info.m3_err = e.message;
    info.m3_errType = e.constructor?.name;
    info.m3_stack = (e.stack || "").split("\n").slice(0, 3);
    return res.json(info);
  }

  // 4: createApp
  try {
    const m = require(path.join(__dirname, "..", "dist", "main"));
    const app = await m.createApp();
    info.m4_create = "ok";
    await app.close();
  } catch (e) {
    info.m4_create = "error";
    info.m4_err = e.message;
    info.m4_errType = e.constructor?.name;
    info.m4_stack = (e.stack || "").split("\n").slice(0, 5);
  }

  res.json(info);
};
