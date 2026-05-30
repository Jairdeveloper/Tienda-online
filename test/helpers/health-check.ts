import { INestApplication } from '@nestjs/common';
import { HealthService } from '../../src/health/health.service';

export async function ensureDbAndRedis(app: INestApplication): Promise<void> {
  const health = app.get(HealthService);
  const result = await health.check();
  if (result.status !== 'ok') {
    const details = Object.entries(result.checks)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    throw new Error(
      `E2E prereq failed: DB/Redis not reachable (${details}). ` +
        'Ensure `docker compose up -d` is running PostgreSQL and Redis.',
    );
  }
}
