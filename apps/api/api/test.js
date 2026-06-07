const path = require("path");

module.exports = async (req, res) => {
  const info = {};

  // Test 0: can I require ANYTHING?
  try { require("path"); info.t0_path = "ok"; } catch (e) { info.t0_path = e.message; }
  try { require("fs"); info.t0_fs = "ok"; } catch (e) { info.t0_fs = e.message; }
  try { require("@prisma/client"); info.t0_prisma = "ok"; } catch (e) { info.t0_prisma = e.message; }
  try { require("@nestjs/common"); info.t0_nest = "ok"; } catch (e) { info.t0_nest = e.message; }
  try { require("helmet"); info.t0_helmet = "ok"; } catch (e) { info.t0_helmet = e.message; }

  // Test 1: require dist/prisma/prisma.module (needs @nestjs/common)
  try {
    const pm = require(path.join(__dirname, "..", "dist", "prisma", "prisma.module"));
    info.m1 = "ok";
  } catch (e) {
    info.m1 = "err:" + e.message;
  }

  res.json(info);
};
