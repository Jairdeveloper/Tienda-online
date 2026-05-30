import 'reflect-metadata';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ensureDbAndRedis } from './helpers/health-check';

describe('Catalog (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );

    await app.init();
    await ensureDbAndRedis(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/catalog/categories', () => {
    it('should return list of categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/catalog/categories')
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('slug');
      }
    });
  });

  describe('GET /api/v1/catalog/products', () => {
    it('should return paginated products', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/catalog/products')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should filter by categoryId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/catalog/products?categoryId=00000000-0000-0000-0000-000000000000')
        .expect(HttpStatus.OK);

      expect(res.body.items).toHaveLength(0);
    });

    it('should filter by search query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/catalog/products?q=auricular')
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('items');
    });
  });

  describe('GET /api/v1/catalog/inventory/:variantId', () => {
    it('should return 404 for non-existent variant', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/catalog/inventory/00000000-0000-0000-0000-000000000000')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /api/v1/catalog/status', () => {
    it('should return ok', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/catalog/status')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ module: 'catalog', status: 'ok' });
    });
  });
});
