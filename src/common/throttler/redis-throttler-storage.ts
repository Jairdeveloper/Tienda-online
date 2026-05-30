import { Inject, Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import type { RedisClient } from '../../redis/redis.constants';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

const INCREMENT_SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local blockExists = redis.call("EXISTS", blockKey)
if blockExists == 1 then
  local blockPTTL = redis.call("PTTL", blockKey)
  local ttlSec = math.max(0, math.ceil(blockPTTL / 1000))
  return {limit + 1, ttlSec, 1, ttlSec}
end

local totalHits = redis.call("INCR", hitsKey)
if totalHits == 1 then
  redis.call("PEXPIRE", hitsKey, ttl)
end

local hitsPTTL = redis.call("PTTL", hitsKey)
local timeToExpire = math.max(0, math.ceil(hitsPTTL / 1000))

if totalHits > limit and blockDuration > 0 then
  redis.call("SET", blockKey, "1", "PX", blockDuration)
  redis.call("DEL", hitsKey)
  local blockSec = math.max(0, math.ceil(blockDuration / 1000))
  return {totalHits, blockSec, 1, blockSec}
end

return {totalHits, timeToExpire, 0, 0}
`;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitsKey = `throttler:${throttlerName}:${key}:hits`;
    const blockKey = `throttler:${throttlerName}:${key}:block`;

    const result = await this.redis.eval(
      INCREMENT_SCRIPT,
      2,
      hitsKey,
      blockKey,
      ttl,
      limit,
      blockDuration,
    );

    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] = result as [number, number, number, number];

    return {
      totalHits,
      timeToExpire,
      isBlocked: isBlocked === 1,
      timeToBlockExpire,
    };
  }
}
