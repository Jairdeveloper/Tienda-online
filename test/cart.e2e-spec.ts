import 'reflect-metadata';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ensureDbAndRedis } from './helpers/health-check';

describe('Cart (e2e)', () => {
  let app: INestApplication;
  const testEmail = `cart_e2e_${Date.now()}@test.com`;
  const testPassword = 'E2eTest123!';
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThrottlerStorage)
      .useValue({ increment: () => Promise.resolve({ totalHits: 0, timeToExpire: 0 }) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );

    await app.init();
    await ensureDbAndRedis(app);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Cart Test User' });

    accessToken = res.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/cart', () => {
    it('should return active cart (creates if needed)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body.status).toBe('active');
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/cart')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/cart/items', () => {
    it('should reject invalid variantId', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ variantId: 'invalid', quantity: 1 })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/cart/clear', () => {
    it('should clear cart', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/clear')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.message).toBe('Cart cleared successfully');
    });
  });

  describe('GET /api/v1/cart/status', () => {
    it('should return ok', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/cart/status')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ module: 'cart', status: 'ok' });
    });
  });
});
