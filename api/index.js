const serverless = require("serverless-http");

let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const { createApp } = require("../dist/main");
    const app = await createApp();
    await app.init();
    handler = serverless(app.getHttpAdapter().getInstance());
  }
  return handler(req, res);
};
