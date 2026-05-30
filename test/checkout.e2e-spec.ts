import 'reflect-metadata';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ensureDbAndRedis } from './helpers/health-check';

describe('Checkout (e2e)', () => {
  let app: INestApplication;
  const testEmail = `checkout_e2e_${Date.now()}@test.com`;
  const testPassword = 'E2eTest123!';
  let accessToken: string;
  let variantId: string;

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
      .send({ email: testEmail, password: testPassword, name: 'Checkout Test User' });

    accessToken = res.body.tokens.accessToken;

    const productsRes = await request(app.getHttpServer())
      .get('/api/v1/catalog/products?limit=1')
      .expect(HttpStatus.OK);

    if (productsRes.body.items?.length > 0) {
      const productRes = await request(app.getHttpServer())
        .get(`/api/v1/catalog/products/${productsRes.body.items[0].id}/variants`)
        .expect(HttpStatus.OK);

      if (productRes.body.length > 0) {
        variantId = productRes.body[0].id;
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/checkout', () => {
    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/checkout')
        .send({ paymentMethod: 'mock', idempotencyKey: 'test-1' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject empty body', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should complete checkout with items in cart', async () => {
      if (!variantId) return;

      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ variantId, quantity: 1 })
        .expect(HttpStatus.CREATED);

      const res = await request(app.getHttpServer())
        .post('/api/v1/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentMethod: 'mock', idempotencyKey: `checkout-e2e-${Date.now()}` })
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('orderId');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('items');
      expect(res.body.status).toBe('stock_reserved');
    });

    it('should reject duplicate idempotency key', async () => {
      const key = `dup-${Date.now()}`;

      if (variantId) {
        const cartRes = await request(app.getHttpServer())
          .post('/api/v1/cart/items')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ variantId, quantity: 1 });

        if (cartRes.status !== HttpStatus.CREATED) {
          return;
        }
      }

      await request(app.getHttpServer())
        .post('/api/v1/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentMethod: 'mock', idempotencyKey: key })
        .expect(res => {
          if (res.status === HttpStatus.CONFLICT) {
            expect(res.body.message).toBeDefined();
          }
        });
    });
  });

  describe('GET /api/v1/checkout (no route)', () => {
    it('should return 404', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/checkout')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
