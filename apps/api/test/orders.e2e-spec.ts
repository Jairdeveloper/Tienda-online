import 'reflect-metadata';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ensureDbAndRedis } from './helpers/health-check';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  const testEmail = `orders_e2e_${Date.now()}@test.com`;
  const testPassword = 'E2eTest123!';
  let accessToken: string;
  let orderId: string;

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
      .send({ email: testEmail, password: testPassword, name: 'Orders Test User' });

    accessToken = res.body.tokens.accessToken;

    const productsRes = await request(app.getHttpServer())
      .get('/api/v1/catalog/products?limit=1')
      .expect(HttpStatus.OK);

    if (productsRes.body.items?.length > 0) {
      const productRes = await request(app.getHttpServer())
        .get(`/api/v1/catalog/products/${productsRes.body.items[0].id}/variants`)
        .expect(HttpStatus.OK);

      const variantId = productRes.body[0]?.id;
      if (variantId) {
        await request(app.getHttpServer())
          .post('/api/v1/cart/items')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ variantId, quantity: 1 })
          .expect(HttpStatus.CREATED);

        const checkoutRes = await request(app.getHttpServer())
          .post('/api/v1/checkout')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ paymentMethod: 'mock', idempotencyKey: `order-${Date.now()}` })
          .expect(HttpStatus.CREATED);

        orderId = checkoutRes.body.orderId;
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/orders', () => {
    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return orders list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return order detail', async () => {
      if (!orderId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.id).toBe(orderId);
      expect(res.body).toHaveProperty('items');
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /api/v1/orders/:id/cancel', () => {
    it('should cancel an order', async () => {
      if (!orderId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reason: 'E2E test cancellation' })
        .expect(HttpStatus.OK);

      expect(res.body.status).toBe('cancelled');
    });
  });

  describe('GET /api/v1/orders/:id/status', () => {
    it('should return order status', async () => {
      if (!orderId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.id).toBe(orderId);
      expect(res.body).toHaveProperty('status');
    });
  });
});
