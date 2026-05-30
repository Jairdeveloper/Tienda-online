import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import type { RedisClient } from './redis.constants';

const LOCK_PREFIX = 'lock:';
const DEFAULT_TTL = 10;

@Injectable()
export class RedisLockService {
  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

  async acquire(
    resource: string,
    identifier: string,
    ttlSeconds: number = DEFAULT_TTL,
  ): Promise<boolean> {
    const key = `${LOCK_PREFIX}${resource}`;
    const result = await this.client.set(key, identifier, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async release(resource: string, identifier: string): Promise<boolean> {
    const key = `${LOCK_PREFIX}${resource}`;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, key, identifier);
    return result === 1;
  }

  async isLocked(resource: string): Promise<boolean> {
    const key = `${LOCK_PREFIX}${resource}`;
    const result = await this.client.exists(key);
    return result === 1;
  }
}
