const path = require("path");

module.exports = async (req, res) => {
  const mod = req.query?.mod || "prisma";
  const info = { mod };

  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

  try {
    const m = require(path.join(__dirname, "..", "dist", mod, mod + ".module"));
    info.type = typeof m;
    info.keys = Object.keys(m).join(",");
    res.json(info);
  } catch (e) {
    res.json({ error: e.message, type: e.constructor?.name, stack: (e.stack || "").split("\n").slice(0, 2) });
  }
};
