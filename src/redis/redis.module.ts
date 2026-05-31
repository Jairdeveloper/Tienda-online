import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { REDIS_CLIENT } from "./redis.constants";
import type { RedisClient } from "./redis.constants";
import { RedisService } from "./redis.service";
import { RedisLockService } from "./redis-lock.service";
import { UpstashClient } from "./upstash-client";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): RedisClient => {
        const nodeEnv = configService.get<string>("NODE_ENV", "development");
        const redisUrl = configService.get<string>("REDIS_URL");

        if (nodeEnv === "production") {
          const token = configService.get<string>("UPSTASH_REDIS_TOKEN") || "";
          return new UpstashClient(redisUrl!, token);
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
