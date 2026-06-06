// Step-by-step diagnostic — isolates NestJS crash location
const path = require("path");
const basedir = path.resolve(__dirname, "..");

module.exports = async (req, res) => {
  const info = {};

  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  }

  // Step 1: require @prisma/client
  try {
    const pm = require("@prisma/client");
    info.step1_require_prisma = "ok";
    info.prismaClientType = typeof pm.PrismaClient;
  } catch (e) {
    info.step1_require_prisma = "error";
    info.step1_error = e.message;
    return res.json(info);
  }

  // Step 2: require dist/main
  try {
    const m = require(path.join(basedir, "dist", "main"));
    info.step2_require_main = "ok";
    info.hasCreateApp = typeof m.createApp;
  } catch (e) {
    info.step2_require_main = "error";
    info.step2_error = e.message;
    info.step2_code = e.code;
    return res.json(info);
  }

  // Step 3: createApp (without init)
  let app;
  try {
    const m = require(path.join(basedir, "dist", "main"));
    app = await m.createApp();
    info.step3_createApp = "ok";
  } catch (e) {
    info.step3_createApp = "error";
    info.step3_error = e.message;
    return res.json(info);
  }

  // Step 4: app.init
  try {
    await app.init();
    info.step4_init = "ok";
  } catch (e) {
    info.step4_init = "error";
    info.step4_error = e.message;
  }

  res.json(info);
};
