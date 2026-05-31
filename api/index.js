let app;
let initError;

module.exports = async (req, res) => {
  if (initError) {
    res.status(500).json({ error: "init_failed", message: initError.message });
    return;
  }

  if (!app) {
    try {
      const { createApp } = require("../dist/main");
      app = await createApp();
      await app.init();
    } catch (err) {
      initError = err;
      res
        .status(500)
        .json({
          error: "init_failed",
          message: err.message,
          stack: err.stack?.split("\n").slice(0, 5),
        });
      return;
    }
  }

  const expressInstance = app.getHttpAdapter().getInstance();

  return new Promise((resolve) => {
    res.on("finish", resolve);
    expressInstance(req, res);
  });
};
