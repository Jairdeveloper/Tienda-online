const path = require("path");
const basedir = path.resolve(__dirname, "..");

module.exports = async (req, res) => {
  const info = {};

  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  }
  info.engineType = process.env.PRISMA_CLIENT_ENGINE_TYPE;

  // Level 1: just require @prisma/client
  try {
    const pm = require("@prisma/client");
    info.l1_prisma = "ok";
    info.l1_clientType = typeof pm.PrismaClient;
  } catch (e) {
    info.l1_prisma = "error";
    info.l1_err = e.message;
    return res.json(info);
  }

  // Level 2: require reflect-metadata
  try {
    require("reflect-metadata");
    info.l2_reflect = "ok";
    info.l2_hasDefine = typeof Reflect.defineMetadata;
  } catch (e) {
    info.l2_reflect = "error";
    info.l2_err = e.message;
    return res.json(info);
  }

  // Level 3: require @nestjs/common and call Global on a class
  try {
    const common = require("@nestjs/common");
    const NestModule = class Nested {};
    common.Global()(common.Module({ providers: [] })(NestModule));
    info.l3_nest_global = "ok";
  } catch (e) {
    info.l3_nest_global = "error";
    info.l3_err = e.message;
    return res.json(info);
  }

  // Level 4: require dist/prisma/prisma.service
  try {
    const ps = require(path.join(basedir, "dist", "prisma", "prisma.service"));
    info.l4_service = "ok";
    info.l4_serviceType = typeof ps.PrismaService;
  } catch (e) {
    info.l4_service = "error";
    info.l4_err = e.message;
    return res.json(info);
  }

  // Level 5: require dist/prisma/prisma.module
  try {
    const pm2 = require(path.join(basedir, "dist", "prisma", "prisma.module"));
    info.l5_module = "ok";
    info.l5_moduleType = typeof pm2.PrismaModule;
  } catch (e) {
    info.l5_module = "error";
    info.l5_err = e.message;
    info.l5_errType = e.constructor?.name;
    info.l5_stack = (e.stack || "").split("\n").slice(0, 3);
    return res.json(info);
  }

  // Level 6: require dist/main and createApp
  try {
    const m = require(path.join(basedir, "dist", "main"));
    await m.createApp();
    info.l6_create = "ok";
  } catch (e) {
    info.l6_create = "error";
    info.l6_err = e.message;
    info.l6_errType = e.constructor?.name;
    info.l6_stack = (e.stack || "").split("\n").slice(0, 5);
  }

  res.json(info);
};
