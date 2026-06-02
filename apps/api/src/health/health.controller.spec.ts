import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockService: HealthService;

  beforeEach(() => {
    mockService = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        service: 'api',
        timestamp: '2026-05-27T00:00:00.000Z',
        checks: { database: 'ok', redis: 'ok' },
      }),
    } as any;
    controller = new HealthController(mockService);
  });

  it('should return health payload', async () => {
    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(typeof result.timestamp).toBe('string');
    expect(result.checks).toEqual({ database: 'ok', redis: 'ok' });
  });
});
