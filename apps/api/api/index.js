const path = require("path");
const __basedir = path.resolve(__dirname, "..");

// Prisma proxy: prevent Vercel postinstall + override CI detection
try {
  const pm = require("@prisma/client");
  const Orig = pm.PrismaClient;
  pm.PrismaClient = new Proxy(Orig, {
    construct(t, a) {
      const o = a[0] || {};
      o.__internal = o.__internal || {};
      const orig = o.__internal.configOverride;
      o.__internal.configOverride = (c) => {
        let r = orig ? orig(c) : { ...c };
        r.postinstall = false;
        r.ciName = undefined;
        return r;
      };
      a[0] = o;
      return Reflect.construct(t, a);
    },
  });
} catch (_) {}

let mod;
try {
  mod = require(path.join(__basedir, "dist", "main"));
} catch (e) {
  mod = { _loadError: e };
}

let app;

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

  if (!mod || mod._loadError) {
    return send(500, { error: "load_failed" });
  }

  if (!app) {
    try {
      app = await mod.createApp();
      await app.init();
    } catch (e) {
      return send(500, { error: "init_failed", message: e.message });
    }
  }

  try {
    const instance = app.getHttpAdapter().getInstance();
    return new Promise((resolve) => {
      res.on("finish", () => resolve());
      instance(req, res);
    });
  } catch (e) {
    send(500, { error: "dispatch_error", message: e.message });
  }
};
