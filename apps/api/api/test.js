const path = require("path");

module.exports = async (req, res) => {
  const info = {};

  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

  // Load all modules (we know this works)
  try {
    const pm = require(path.join(__dirname, "..", "dist", "prisma", "prisma.module"));
    info.pm = "ok";
  } catch (e) { return res.json({ err: "pm:" + e.message }); }

  try {
    const am = require(path.join(__dirname, "..", "dist", "app.module"));
    info.am = "ok";
  } catch (e) { return res.json({ err: "am:" + e.message }); }

  let main;
  try {
    main = require(path.join(__dirname, "..", "dist", "main"));
    info.main = "ok";
  } catch (e) { return res.json({ err: "main:" + e.message }); }

  // Now call createApp (this is what handler.js does)
  try {
    const app = await main.createApp();
    info.create = "ok";
    try { await app.close(); info.close = "ok"; } catch (e) { info.close = e.message; }
  } catch (e) {
    info.create = "err:" + (e.message || e.constructor?.name || "?");
    info.createStack = (e.stack || "").split("\n").slice(0, 5);
  }

  res.json(info);
};
