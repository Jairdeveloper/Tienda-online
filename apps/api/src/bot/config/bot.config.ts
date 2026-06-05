import { registerAs } from "@nestjs/config";

export default registerAs("bot", () => ({
  serviceUrl: process.env.BOT_SERVICE_URL || "http://localhost:8000",
  enabled: process.env.BOT_ENABLED !== "false",
}));
