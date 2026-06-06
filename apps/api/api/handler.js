module.exports = async (req, res) => {
  try {
    if (!res.headersSent) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    }
  } catch (_) {
    try { res.end("{}"); } catch (_) {}
  }
};
