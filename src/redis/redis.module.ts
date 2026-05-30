import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from './redis.constants';
import type { RedisClient } from './redis.constants';
import { RedisService } from './redis.service';
import { RedisLockService } from './redis-lock.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): RedisClient => {
        const Redis = require('ioredis');
        return new Redis(configService.get<string>('REDIS_URL'));
      },
      inject: [ConfigService],
    },
    RedisService,
    RedisLockService,
  ],
  exports: [RedisService, RedisLockService, REDIS_CLIENT],
})
export class RedisModule {}
