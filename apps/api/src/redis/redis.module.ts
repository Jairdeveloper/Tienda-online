import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { REDIS_CLIENT } from "./redis.constants";
import type { RedisClient } from "./redis.constants";
import { RedisService } from "./redis.service";
import { RedisLockService } from "./redis-lock.service";
import { UpstashClient } from "./upstash-client";

const noopClient: RedisClient = {
  get: async () => null,
  set: async () => "OK",
  del: async () => 0,
  exists: async () => 0,
  ping: async () => "PONG",
  scan: async () => ["0", []] as [string, string[]],
  eval: async () => null,
  quit: async () => {},
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): RedisClient => {
        const redisUrl = configService.get<string>("REDIS_URL", "");

        if (!redisUrl) {
          return noopClient;
        }

        const nodeEnv = configService.get<string>("NODE_ENV", "development");

        if (nodeEnv === "production") {
          const token = configService.get<string>("UPSTASH_REDIS_TOKEN") || "";
          return new UpstashClient(redisUrl, token);
        }

        const Redis = require("ioredis");
        return new Redis(redisUrl);
      },
      inject: [ConfigService],
    },
    RedisService,
    RedisLockService,
  ],
  exports: [RedisService, RedisLockService, REDIS_CLIENT],
})
export class RedisModule {}
