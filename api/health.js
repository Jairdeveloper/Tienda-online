module.exports = async (req, res) => {
  res.json({ status: "ok", time: Date.now() });
};
