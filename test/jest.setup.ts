process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '0';
process.env.API_PREFIX = process.env.API_PREFIX ?? 'api/v1';
process.env.CORS_ENABLED = process.env.CORS_ENABLED ?? 'false';
process.env.SWAGGER_ENABLED = process.env.SWAGGER_ENABLED ?? 'false';

// Required by env validation. These are safe dummy values for tests.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test_secret_change_me';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://tienda:tienda_dev@localhost:5432/tienda_online?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'test-webhook-secret-for-jest';

