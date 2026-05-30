import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.constants';
import type { RedisClient } from '../redis/redis.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {}

  async check() {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();

    const status = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      service: 'api',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkRedis(): Promise<string> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'ok' : 'error';
    } catch {
      return 'error';
    }
  }
}
