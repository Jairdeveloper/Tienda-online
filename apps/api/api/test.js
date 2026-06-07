const path = require("path");
const basedir = path.resolve(__dirname, "..");

module.exports = async (req, res) => {
  const info = {};
  if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

  // Load all dist modules (require only, no createApp)
  const m = {};
  for (const name of ["redis", "common", "prisma", "health", "auth", "users", "catalog", "inventory", "cart", "checkout", "orders", "payments", "admin", "bot"]) {
    try {
      m[name] = require(path.join(basedir, "dist", name, name + ".module")).name;
      info["req_" + name] = "ok";
    } catch (e) {
      info["req_" + name] = "err:" + (e.message || "?");
      return res.json(info);
    }
  }

  // All require() succeed — now try createApp with modules one at a time
  const core = require("@nestjs/core");
  const common = require("@nestjs/common");
  const config = require("@nestjs/config");
  const { ExpressAdapter } = require("@nestjs/platform-express");
  const cfg = config.ConfigModule.forRoot({ isGlobal: true });

  // Get the ACTUAL module references for createApp
  const mods = {
    redis: require(path.join(basedir, "dist", "redis", "redis.module")).RedisModule,
    common: require(path.join(basedir, "dist", "common", "common.module")).CommonModule,
    prisma: require(path.join(basedir, "dist", "prisma", "prisma.module")).PrismaModule,
  };

  // Test 1: cfg + redis + common + prisma
  try {
    class T1 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma] })(T1);
    const a1 = await core.NestFactory.create(T1, new ExpressAdapter(), { bufferLogs: true });
    await a1.close();
    info.t1_base = "ok";
  } catch (e) {
    info.t1_base = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 2: add health
  try {
    const health = require(path.join(basedir, "dist", "health", "health.module")).HealthModule;
    class T2 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, health] })(T2);
    const a2 = await core.NestFactory.create(T2, new ExpressAdapter(), { bufferLogs: true });
    await a2.close();
    info.t2_health = "ok";
  } catch (e) {
    info.t2_health = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 3: add auth
  try {
    const auth = require(path.join(basedir, "dist", "auth", "auth.module")).AuthModule;
    class T3 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, auth] })(T3);
    const a3 = await core.NestFactory.create(T3, new ExpressAdapter(), { bufferLogs: true });
    await a3.close();
    info.t3_auth = "ok";
  } catch (e) {
    info.t3_auth = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 4: add users
  try {
    const users = require(path.join(basedir, "dist", "users", "users.module")).UsersModule;
    class T4 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, users] })(T4);
    const a4 = await core.NestFactory.create(T4, new ExpressAdapter(), { bufferLogs: true });
    await a4.close();
    info.t4_users = "ok";
  } catch (e) {
    info.t4_users = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 5: add catalog
  try {
    const catalog = require(path.join(basedir, "dist", "catalog", "catalog.module")).CatalogModule;
    class T5 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, catalog] })(T5);
    const a5 = await core.NestFactory.create(T5, new ExpressAdapter(), { bufferLogs: true });
    await a5.close();
    info.t5_catalog = "ok";
  } catch (e) {
    info.t5_catalog = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 6: add inventory
  try {
    const inventory = require(path.join(basedir, "dist", "inventory", "inventory.module")).InventoryModule;
    class T6 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, inventory] })(T6);
    const a6 = await core.NestFactory.create(T6, new ExpressAdapter(), { bufferLogs: true });
    await a6.close();
    info.t6_inventory = "ok";
  } catch (e) {
    info.t6_inventory = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 7: add cart
  try {
    const cart = require(path.join(basedir, "dist", "cart", "cart.module")).CartModule;
    class T7 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, cart] })(T7);
    const a7 = await core.NestFactory.create(T7, new ExpressAdapter(), { bufferLogs: true });
    await a7.close();
    info.t7_cart = "ok";
  } catch (e) {
    info.t7_cart = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 8: add checkout
  try {
    const checkout = require(path.join(basedir, "dist", "checkout", "checkout.module")).CheckoutModule;
    class T8 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, checkout] })(T8);
    const a8 = await core.NestFactory.create(T8, new ExpressAdapter(), { bufferLogs: true });
    await a8.close();
    info.t8_checkout = "ok";
  } catch (e) {
    info.t8_checkout = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 9: add orders
  try {
    const orders = require(path.join(basedir, "dist", "orders", "orders.module")).OrdersModule;
    class T9 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, orders] })(T9);
    const a9 = await core.NestFactory.create(T9, new ExpressAdapter(), { bufferLogs: true });
    await a9.close();
    info.t9_orders = "ok";
  } catch (e) {
    info.t9_orders = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 10: add payments
  try {
    const payments = require(path.join(basedir, "dist", "payments", "payments.module")).PaymentsModule;
    class T10 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, payments] })(T10);
    const a10 = await core.NestFactory.create(T10, new ExpressAdapter(), { bufferLogs: true });
    await a10.close();
    info.t10_payments = "ok";
  } catch (e) {
    info.t10_payments = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 11: add admin
  try {
    const admin = require(path.join(basedir, "dist", "admin", "admin.module")).AdminModule;
    class T11 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, admin] })(T11);
    const a11 = await core.NestFactory.create(T11, new ExpressAdapter(), { bufferLogs: true });
    await a11.close();
    info.t11_admin = "ok";
  } catch (e) {
    info.t11_admin = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  // Test 12: add bot
  try {
    const bot = require(path.join(basedir, "dist", "bot", "bot.module")).BotModule;
    class T12 {}
    common.Module({ imports: [cfg, mods.redis, mods.common, mods.prisma, bot] })(T12);
    const a12 = await core.NestFactory.create(T12, new ExpressAdapter(), { bufferLogs: true });
    await a12.close();
    info.t12_bot = "ok";
  } catch (e) {
    info.t12_bot = "err:" + (e.message || e.constructor?.name || "?");
    return res.json(info);
  }

  info.all = "ok";
  res.json(info);
};
