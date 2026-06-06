import { Inject, Injectable } from "@nestjs/common";
import { REDIS_CLIENT } from "../redis/redis.constants";
import type { RedisClient } from "../redis/redis.constants";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {}

  async check() {
    const dbStatus = await this.checkDatabase();
    const redisResult = await this.checkRedis();

    const status =
      dbStatus === "ok" && redisResult.status === "ok" ? "ok" : "degraded";

    return {
      status,
      service: "api",
      version: "DEBUG-003",
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        redis: redisResult.status,
        redisDetail: redisResult.detail,
      },
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return "ok";
    } catch {
      return "error";
    }
  }

  private async checkRedis(): Promise<{
    status: string;
    detail: string | null;
  }> {
    try {
      const pong = await this.redis.ping();
      return {
        status: pong === "PONG" ? "ok" : "error",
        detail: null,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("REDIS_CHECK_ERROR:", msg);
      return { status: "error", detail: msg };
    }
  }
}
