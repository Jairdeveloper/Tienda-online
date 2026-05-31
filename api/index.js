let app;
let initError;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});

module.exports = async (req, res) => {
  console.log("HANDLER_CALLED", req.method, req.url);

  if (initError) {
    console.log("INIT_ERROR", initError.message);
    res.status(500).json({ error: "init_failed", message: initError.message });
    return;
  }

  if (!app) {
    try {
      console.log("LOADING_APP");
      const { createApp } = require("../dist/main");
      console.log("CREATE_APP_FOUND", typeof createApp);
      app = await createApp();
      console.log("APP_CREATED");
      await app.init();
      console.log("APP_INITIALIZED");
    } catch (err) {
      console.log(
        "INIT_ERROR_DETAILED",
        err.message,
        err.stack?.split("\n").slice(0, 3).join(" | "),
      );
      initError = err;
      res.status(500).json({ error: "init_failed", message: err.message });
      return;
    }
  }

  const expressInstance = app.getHttpAdapter().getInstance();

  return new Promise((resolve) => {
    res.on("finish", resolve);
    expressInstance(req, res);
  });
};
