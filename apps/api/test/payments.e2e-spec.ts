import 'reflect-metadata';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ensureDbAndRedis } from './helpers/health-check';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  const testEmail = `payments_e2e_${Date.now()}@test.com`;
  const testPassword = 'E2eTest123!';

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
      .send({ email: testEmail, password: testPassword, name: 'Payments Test User' });

    accessToken = res.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createOrder(): Promise<string> {
    const productsRes = await request(app.getHttpServer())
      .get('/api/v1/catalog/products?limit=1')
      .expect(HttpStatus.OK);

    const productRes = await request(app.getHttpServer())
      .get(`/api/v1/catalog/products/${productsRes.body.items[0].id}/variants`)
      .expect(HttpStatus.OK);

    const variantId = productRes.body[0].id;

    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ variantId, quantity: 1 })
      .expect(HttpStatus.CREATED);

    const checkoutRes = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ paymentMethod: 'mock', idempotencyKey: `pay-e2e-${Date.now()}-${Math.random()}` })
      .expect(HttpStatus.CREATED);

    return checkoutRes.body.orderId;
  }

  describe('POST /api/v1/payments/:orderId/intent', () => {
    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/none/intent')
        .send({ provider: 'mock' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should create payment intent', async () => {
      const orderId = await createOrder();

      const res = await request(app.getHttpServer())
        .post(`/api/v1/payments/${orderId}/intent`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ provider: 'mock' })
        .expect(HttpStatus.CREATED);

      expect(res.body.provider).toBe('mock');
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('POST /api/v1/payments/webhooks/mock', () => {
    it('should process webhook', async () => {
      const orderId = await createOrder();

      await request(app.getHttpServer())
        .post(`/api/v1/payments/${orderId}/intent`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ provider: 'mock' })
        .expect(HttpStatus.CREATED);

      const ordersRes = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      const payment = ordersRes.body.payments?.[0];
      if (!payment?.id || !payment?.providerPaymentId) return;

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhooks/mock')
        .send({
          event: 'payment.completed',
          paymentId: payment.id,
          providerPaymentId: payment.providerPaymentId,
          status: 'paid',
          amount: 100,
        })
        .expect(HttpStatus.OK);

      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/payments/:orderId/confirm', () => {
    it('should confirm payment', async () => {
      const orderId = await createOrder();

      await request(app.getHttpServer())
        .post(`/api/v1/payments/${orderId}/intent`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ provider: 'mock' })
        .expect(HttpStatus.CREATED);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/payments/${orderId}/confirm`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('orderStatus');
    });
  });
});
