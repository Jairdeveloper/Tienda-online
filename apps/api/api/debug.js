// Static requires for nft tracing — needed for dynamic require(path.join(...)) below
require("reflect-metadata");
require("@nestjs/common");
require("@nestjs/core");
require("@nestjs/config");
require("@nestjs/swagger");
require("@nestjs/platform-express");
require("helmet");
require("@prisma/client");

const path = require("path");
const basedir = path.resolve(__dirname, "..");

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
}

module.exports = async (req, res) => {
  const info = { steps: [] };

  // A: Load and test inline module (works)
  try {
    const core = require("@nestjs/core");
    const common = require("@nestjs/common");
    const config = require("@nestjs/config");
    const { ExpressAdapter } = require("@nestjs/platform-express");
    const { CommonModule } = require(path.join(basedir, "dist", "common", "common.module"));
    const { RedisModule } = require(path.join(basedir, "dist", "redis", "redis.module"));
    const { PrismaClient } = require("@prisma/client");
    const { PrismaService } = require(path.join(basedir, "dist", "prisma", "prisma.service"));

    common.Global()(common.Module({
      providers: [PrismaService, { provide: PrismaClient, useExisting: PrismaService }],
      exports: [PrismaService, PrismaClient],
    })(class MockP {}));

    class TestA {}
    common.Module({
      imports: [config.ConfigModule.forRoot({ isGlobal: true }), RedisModule, CommonModule, MockP],
      providers: [],
    })(TestA);
    const a = new ExpressAdapter();
    const app = await core.NestFactory.create(TestA, a, { bufferLogs: true });
    await app.init();
    info.steps.push("A_inline_module: ok");
  } catch (e) {
    info.steps.push("A_inline_module: error=" + String(e.message).substring(0, 200));
    // Even if error, the Lambda is alive — we can continue testing
  }

  // B: Now try the REAL compiled PrismaModule (this crashed before)
  try {
    const core2 = require("@nestjs/core");
    const common2 = require("@nestjs/common");
    const config2 = require("@nestjs/config");
    const { ExpressAdapter: EA2 } = require("@nestjs/platform-express");
    const { CommonModule: CM2 } = require(path.join(basedir, "dist", "common", "common.module"));
    const { RedisModule: RM2 } = require(path.join(basedir, "dist", "redis", "redis.module"));
    const { PrismaModule: RealPM } = require(path.join(basedir, "dist", "prisma", "prisma.module"));

    // Count how many exports RealPM has
    info.steps.push("real_module_keys: " + Object.keys(RealPM).join(","));
    info.steps.push("real_module_type: " + typeof RealPM);

    class TestB {}
    common2.Module({
      imports: [config2.ConfigModule.forRoot({ isGlobal: true }), RM2, CM2, RealPM],
      providers: [],
    })(TestB);
    const b = new EA2();
    const app2 = await core2.NestFactory.create(TestB, b, { bufferLogs: true });
    await app2.init();
    info.steps.push("B_real_module: ok");
  } catch (e) {
    info.steps.push("B_real_module: error=" + String(e.message).substring(0, 200));
  }

  res.json(info);
};
