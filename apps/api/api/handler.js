const path = require("path");
const __basedir = path.resolve(__dirname, "..");

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

module.exports = async (req, res) => {
  const send = (status, body) => {
    try {
      if (!res.headersSent) {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(body));
      }
    } catch (_) {
      try { res.end("{}"); } catch (_) {}
    }
  };

  if (req.method === "GET" && req.url && req.url.includes("/bot/status")) {
    return send(200, { status: "bypass_ok" });
  }

  try {
    const mod = require(path.join(__basedir, "dist", "main"));
    return send(200, {
      loaded: true,
      hasCreateApp: typeof mod.createApp === "function",
    });
  } catch (e) {
    return send(500, { error: "load_failed", message: e.message, code: e.code });
  }
};
