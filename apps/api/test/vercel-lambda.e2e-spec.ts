import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ensureDbAndRedis } from './helpers/health-check';

/**
 * Tests de integración para Vercel Lambda.
 *
 * Este archivo verifica los endpoints que Vercel sirve como funciones serverless:
 *
 *   Endpoint        → Lambda                → Propósito
 *   ───────────────   ───────────────────     ─────────────────────────────
 *   GET /_health    → apps/api/api/health.js  Health check rápido (sin deps)
 *   GET /_diag      → apps/api/api/diagnostic.js  Diagnóstico de env vars
 *   GET /api/v1/health  → handler.js → NestJS  Health check completo
 *   POST /api/v1/auth/login → handler.js → NestJS  Login JWT
 *
 * Los Lambdas standalone (_health, _diag) se prueban importando directamente
 * el módulo y simulando objetos req/res.
 *
 * Los endpoints NestJS se prueban mediante el módulo de testing de NestJS
 * (mismo patrón que app.e2e-spec.ts y auth.e2e-spec.ts), lo que replica
 * exactamente la ruta que handler.js sigue en producción:
 *
 *   handler.js → createApp(adapter) → NestJS → AppModule → controllers
 *
 * @see apps/api/api/handler.js
 * @see apps/api/src/main.ts (createApp)
 */

// ─── Helpers para simular req/res de Lambda ──────────────────────────────

interface MockResponse {
  _status: number;
  _headers: Record<string, string>;
  _body: string | null;
  _chunks: Buffer[];
  body: Record<string, unknown> | null;
  writeHead: (status: number, headers?: Record<string, string>) => MockResponse;
  write: (chunk: string | Buffer) => boolean;
  end: (chunk?: string | Buffer) => void;
  json: (data: Record<string, unknown>) => void;
  setHeader: (key: string, value: string) => void;
  status: (code: number) => MockResponse;
}

function createMockReqRes(
  url: string,
  method: string = 'GET',
): { req: Record<string, unknown>; res: MockResponse } {
  const chunks: Buffer[] = [];

  const res: MockResponse = {
    _status: 200,
    _headers: {},
    _body: null,
    _chunks: chunks,
    body: null,

    status(this: MockResponse, code: number) {
      this._status = code;
      return this;
    },

    writeHead(this: MockResponse, status: number, headers?: Record<string, string>) {
      this._status = status;
      if (headers) Object.assign(this._headers, headers);
      return this;
    },

    write(this: MockResponse, chunk: string | Buffer) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    },

    end(this: MockResponse, chunk?: string | Buffer) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const raw = Buffer.concat(chunks).toString('utf8');
      this._body = raw;
      try {
        this.body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        this.body = null;
      }
    },

    json(this: MockResponse, data: Record<string, unknown>) {
      const raw = JSON.stringify(data);
      this._body = raw;
      this.body = data;
      this._headers['content-type'] = 'application/json';
    },

    setHeader(this: MockResponse, key: string, value: string) {
      this._headers[key] = value;
    },
  };

  const req: Record<string, unknown> = {
    url,
    method,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
  };

  return { req, res };
}

// ─── Helpers para cargar Lambdas standalone ─────────────────────────────

function loadHandler(relPath: string): ((req: any, res: any) => Promise<void>) | undefined {
  try {
    return require(relPath);
  } catch {
    return undefined;
  }
}

describe('Vercel Lambda Endpoints (e2e)', () => {
  // ═══════════════════════════════════════════════════════════════════════
  //  Standalone Lambdas (_health, _diag)
  //  ────────────────────────────────────────────────
  //  No requieren DB, Redis ni NestJS. Se prueban importando el módulo
  //  directamente y simulando req/res.
  // ═══════════════════════════════════════════════════════════════════════

  describe('GET /_health → health.js (standalone Lambda)', () => {
    let handler: ((req: any, res: any) => Promise<void>) | undefined;

    beforeAll(() => { handler = loadHandler('../api/health'); });
    beforeEach(() => {
      if (!handler) pending('health.js no disponible. Ejecutar `npm run build` primero.');
    });

    it('debe responder 200 con {"status":"ok"}', async () => {
      const { req, res } = createMockReqRes('/_health');
      await handler!(req, res);
      expect(res._status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
    });

    it('debe incluir timestamp en la respuesta', async () => {
      const { req, res } = createMockReqRes('/_health');
      await handler!(req, res);
      expect(res.body).toHaveProperty('time');
      expect(typeof (res.body as Record<string, unknown>).time).toBe('number');
    });

    it('debe responder rápido (< 100ms)', async () => {
      const start = Date.now();
      const { req, res } = createMockReqRes('/_health');
      await handler!(req, res);
      expect(Date.now() - start).toBeLessThan(100);
    });
  });

  describe('GET /_diag → diagnostic.js (standalone Lambda)', () => {
    let handler: ((req: any, res: any) => Promise<void>) | undefined;

    beforeAll(() => { handler = loadHandler('../api/diagnostic'); });
    beforeEach(() => {
      if (!handler) pending('diagnostic.js no disponible. Ejecutar `npm run build` primero.');
    });

    it('debe responder 200 con {"status":"ok"}', async () => {
      const { req, res } = createMockReqRes('/_diag');
      await handler!(req, res);
      expect(res._status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
    });

    it('debe incluir method, path, headers y env en la respuesta', async () => {
      const { req, res } = createMockReqRes('/_diag', 'POST');
      await handler!(req, res);
      expect(res.body).toHaveProperty('method', 'POST');
      expect(res.body).toHaveProperty('path', '/_diag');
      expect(res.body).toHaveProperty('headers');
      expect(res.body).toHaveProperty('env');
    });

    it('NO debe filtrar secretos en env', async () => {
      const { req, res } = createMockReqRes('/_diag');
      await handler!(req, res);
      const envList = (res.body as Record<string, string[]>).env;
      expect(envList).toBeDefined();
      expect(Array.isArray(envList)).toBe(true);
      for (const key of envList) {
        expect(key).not.toMatch(/TOKEN|SECRET|KEY|PASSWORD/i);
        expect(key).not.toBe('DATABASE_URL');
        expect(key).not.toBe('REDIS_URL');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  NestJS Routes via handler.js
  //  ────────────────────────────────────────────────
  //  Requieren DB + Redis. Se saltan si no están disponibles.
  // ═══════════════════════════════════════════════════════════════════════

  describe('NestJS API Routes', () => {
    let app: INestApplication;

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
    });

    afterAll(async () => {
      await app?.close();
    });

    describe('GET /api/v1/health', () => {
      it('debe responder 200 con {"status":"ok"}', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/health')
          .expect(200);

        expect(response.body).toMatchObject({ status: 'ok', service: 'api' });
      });

      it('debe incluir header x-request-id (middleware global)', async () => {
        const response = await request(app.getHttpServer()).get('/api/v1/health');
        expect(response.headers['x-request-id']).toBeDefined();
        expect(typeof response.headers['x-request-id']).toBe('string');
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('debe loguear admin y retornar tokens JWT', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'admin@tienda.local', password: 'Admin123!' })
          .expect(200);

        expect(response.body.tokens).toBeDefined();
        expect(response.body.tokens.accessToken).toBeDefined();
        expect(response.body.tokens.refreshToken).toBeDefined();
        const parts = (response.body.tokens.accessToken as string).split('.');
        expect(parts).toHaveLength(3);
      });

      it('debe rechazar credenciales inválidas con 401', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'admin@tienda.local', password: 'WrongPass1!' })
          .expect(401);
      });
    });
  });
});
