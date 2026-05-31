let app;

module.exports = async (req, res) => {
  if (!app) {
    const { createApp } = require("../dist/main");
    app = await createApp();
    await app.init();
  }
  const expressInstance = app.getHttpAdapter().getInstance();

  return new Promise((resolve, reject) => {
    res.on("finish", resolve);
    res.on("error", reject);
    expressInstance(req, res);
  });
};
