module.exports = async (req, res) => {
  res.status(200).json({
    status: "ok",
    method: req.method,
    path: req.path,
    headers: req.headers,
    env: Object.keys(process.env)
      .sort()
      .filter(
        (k) =>
          !k.includes("TOKEN") &&
          !k.includes("SECRET") &&
          !k.includes("KEY") &&
          !k.includes("PASSWORD") &&
          k !== "DATABASE_URL" &&
          k !== "REDIS_URL",
      ),
  });
};
