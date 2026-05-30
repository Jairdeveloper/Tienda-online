import type { Redis } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT' as const;

export type RedisClient = Redis;
