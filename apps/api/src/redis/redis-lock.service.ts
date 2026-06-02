import { Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT } from "./redis.constants";
import type { RedisClient } from "./redis.constants";

const LOCK_PREFIX = "lock:";
const DEFAULT_TTL = 10;

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

  async acquire(
    resource: string,
    identifier: string,
    ttlSeconds: number = DEFAULT_TTL,
  ): Promise<boolean> {
    try {
      const key = `${LOCK_PREFIX}${resource}`;
      const result = await this.client.set(
        key,
        identifier,
        "EX",
        ttlSeconds,
        "NX",
      );
      return result === "OK";
    } catch (e) {
      this.logger.warn(
        `Lock acquire error [${resource}]: ${e instanceof Error ? e.message : e}`,
      );
      return false;
    }
  }

  async release(resource: string, identifier: string): Promise<boolean> {
    try {
      const key = `${LOCK_PREFIX}${resource}`;
      const value = await this.client.get(key);
      if (value === identifier) {
        await this.client.del(key);
        return true;
      }
      return false;
    } catch (e) {
      this.logger.warn(
        `Lock release error [${resource}]: ${e instanceof Error ? e.message : e}`,
      );
      return false;
    }
  }

  async isLocked(resource: string): Promise<boolean> {
    try {
      const key = `${LOCK_PREFIX}${resource}`;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (e) {
      this.logger.warn(
        `Lock isLocked error [${resource}]: ${e instanceof Error ? e.message : e}`,
      );
      return false;
    }
  }
}
