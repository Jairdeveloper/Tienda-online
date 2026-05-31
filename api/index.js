let app;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err.message);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err.message);
});

module.exports = async (req, res) => {
  console.log("HANDLER_CALLED", req.method, req.url);

  try {
    if (!app) {
      console.log("LOADING_MODULE");
      const mod = require("../dist/main");
      console.log("MODULE_KEYS:", Object.keys(mod));

      console.log("CREATING_APP");
      app = await mod.createApp();
      console.log("APP_CREATED");

      console.log("INIT_APP");
      await app.init();
      console.log("APP_INITIALIZED");
    }

    console.log("DISPATCHING_TO_EXPRESS");
    const expressInstance = app.getHttpAdapter().getInstance();

    return new Promise((resolve) => {
      res.on("finish", resolve);
      expressInstance(req, res);
    });
  } catch (err) {
    console.error(
      "HANDLER_ERROR:",
      err.message,
      err.stack?.split("\n").slice(0, 3).join(" | "),
    );
    if (!res.headersSent) {
      res
        .status(500)
        .json({
          error: "init_failed",
          message: err.message,
          stack: err.stack?.split("\n").slice(0, 3),
        });
    }
  }
};
