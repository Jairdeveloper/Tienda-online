const path = require("path");
const basedir = path.resolve(__dirname, "..");

module.exports = async (req, res) => {
  const info = {};

  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
  }
  info.engineType = process.env.PRISMA_CLIENT_ENGINE_TYPE;

  // Step 1-3: load prisma.module, app.module, main (all succeeded before)
  try {
    require(path.join(basedir, "dist", "prisma", "prisma.module"));
    info.s1_prismaModule = "ok";
  } catch (e) {
    info.s1_prismaModule = "error";
    info.s1_err = e.message;
    return res.json(info);
  }

  try {
    require(path.join(basedir, "dist", "app.module"));
    info.s2_appModule = "ok";
  } catch (e) {
    info.s2_appModule = "error";
    info.s2_err = e.message;
    return res.json(info);
  }

  let main;
  try {
    main = require(path.join(basedir, "dist", "main"));
    info.s3_main = "ok";
  } catch (e) {
    info.s3_main = "error";
    info.s3_err = e.message;
    return res.json(info);
  }

  // Step 4: call createApp (this is where the crash happens)
  try {
    const app = await main.createApp();
    info.s4_create = "ok";
    try {
      await app.init();
      info.s5_init = "ok";
    } catch (e) {
      info.s5_init = "error";
      info.s5_err = e.message;
      info.s5_errType = e.constructor?.name;
    }
  } catch (e) {
    info.s4_create = "error";
    info.s4_err = e.message;
    info.s4_errType = e.constructor?.name;
    info.s4_stack = (e.stack || "").split("\n").slice(0, 5);
  }

  res.json(info);
};
