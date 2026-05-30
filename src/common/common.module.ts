import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache/cache.service';
import { JsonLoggerService } from './logger/json-logger.service';

@Global()
@Module({
  providers: [JsonLoggerService, CacheService],
  exports: [JsonLoggerService, CacheService],
})
export class CommonModule {}
