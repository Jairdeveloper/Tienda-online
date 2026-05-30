import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import type { RedisClient } from '../../redis/redis.constants';

const DEFAULT_TTL_SECONDS = 300;

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const ttl = ttlSeconds ?? DEFAULT_TTL_SECONDS;
    await this.client.set(key, serialized, 'EX', ttl);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } while (cursor !== '0');
  }
}
