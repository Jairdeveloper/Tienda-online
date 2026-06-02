import { Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT } from "../../redis/redis.constants";
import type { RedisClient } from "../../redis/redis.constants";

const DEFAULT_TTL_SECONDS = 300;

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    } catch (e) {
      this.logger.warn(
        `Cache miss (GET error) [${key}]: ${e instanceof Error ? e.message : e}`,
      );
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const ttl = ttlSeconds ?? DEFAULT_TTL_SECONDS;
      await this.client.set(key, serialized, "EX", ttl);
    } catch (e) {
      this.logger.warn(
        `Cache SET error [${key}]: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (e) {
      this.logger.warn(
        `Cache DEL error [${key}]: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== "0");
    } catch (e) {
      this.logger.warn(
        `Cache invalidate error [${pattern}]: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}
