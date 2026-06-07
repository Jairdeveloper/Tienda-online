const path = require("path");

module.exports = async (req, res) => {
  const info = {};

  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

  // Test module loading
  try { require("@nestjs/common"); info.a1 = "ok"; } catch (e) { info.a1 = e.message; return res.json(info); }
  try { require(path.join(__dirname, "..", "dist", "prisma", "prisma.module")); info.a2 = "ok"; } catch (e) { info.a2 = e.message; return res.json(info); }
  try { require(path.join(__dirname, "..", "dist", "app.module")); info.a3 = "ok"; } catch (e) { info.a3 = e.message; return res.json(info); }
  try { require(path.join(__dirname, "..", "dist", "main")); info.a4 = "ok"; } catch (e) { info.a4 = e.message; return res.json(info); }

  // Test createApp (inline, minimal)
  try {
    const core = require("@nestjs/core");
    const common = require("@nestjs/common");
    const config = require("@nestjs/config");
    const express = require("@nestjs/platform-express");
    const { PrismaModule } = require(path.join(__dirname, "..", "dist", "prisma", "prisma.module"));
    const { RedisModule } = require(path.join(__dirname, "..", "dist", "redis", "redis.module"));

    class T {}
    common.Module({
      imports: [config.ConfigModule.forRoot({ isGlobal: true }), RedisModule, PrismaModule],
    })(T);
    const app = await core.NestFactory.create(T, new express.ExpressAdapter(), { bufferLogs: true });
    info.b1 = "ok";
    await app.close();
  } catch (e) {
    info.b1 = "err:" + (e.message || e.constructor?.name);
    info.b1s = (e.stack || "").split("\n").slice(0, 3);
  }

  res.json(info);
};
