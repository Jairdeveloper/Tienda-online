import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    description: 'Estado de salud del backend con checks de dependencias',
    schema: {
      example: {
        status: 'ok',
        service: 'api',
        timestamp: '2026-05-26T10:00:00.000Z',
        checks: { database: 'ok', redis: 'ok' },
      },
    },
  })
  getHealth() {
    return this.healthService.check();
  }
}
