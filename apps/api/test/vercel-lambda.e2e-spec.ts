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
  status: number;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  writeHead: (status: number, headers?: Record<string, string>) => MockResponse;
  write: (chunk: string | Buffer) => boolean;
  end: (chunk?: string | Buffer) => void;
  json: (data: Record<string, unknown>) => void;
  status: (code: number) => MockResponse;
  setHeader: (key: string, value: string) => void;
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
    status: 200,
    headers: {},
    body: null,

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

    status(this: MockResponse, code: number) {
      this._status = code;
      return this;
    },

    setHeader(this: MockResponse, key: string, value: string) {
      this._headers[key] = value;
    },
  };

  // Re-define getters now that methods are assigned
  Object.defineProperty(res, 'status', {
    get() {
      return res._status;
    },
  });

  Object.defineProperty(res, 'headers', {
    get() {
      return res._headers;
    },
  });

  const req: Record<string, unknown> = {
    url,
    method,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
  };

  return { req, res };
}

// ─── Suite de tests ──────────────────────────────────────────────────────

describe('Vercel Lambda Endpoints (e2e)', () => {
  let app: INestApplication;
  let healthHandler: ((req: any, res: any) => Promise<void>) | undefined;
  let diagHandler: ((req: any, res: any) => Promise<void>) | undefined;

  beforeAll(async () => {
    // ── Inicializar NestJS app para los tests de rutas API ──
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

    // ── Cargar handlers Lambda standalone ──
    // NOTA: Estos require() resuelven desde apps/api/dist. Ejecutar después de
    // `npm run build` para que el compilado de TypeScript esté disponible.
    try {
      healthHandler = require('../api/health');
    } catch {
      // No disponible si el build no se ha ejecutado; los tests de Lambda
      // standalone se saltarán automáticamente.
    }
    try {
      diagHandler = require('../api/diagnostic');
    } catch {
      // ídem
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  Standalone Lambdas (_health, _diag)
  //  ────────────────────────────────────────────────
  //  Estos endpoints los sirve Vercel directamente desde health.js y
  //  diagnostic.js. Se prueban importando el módulo y simulando req/res.
  // ═══════════════════════════════════════════════════════════════════════

  describe('GET /_health → health.js (standalone Lambda)', () => {
    beforeEach(() => {
      if (!healthHandler) {
        pending('health.js no disponible. Ejecutar `npm run build` primero.');
      }
    });

    it('debe responder 200 con {"status":"ok"}', async () => {
      const { req, res } = createMockReqRes('/_health');
      await healthHandler!(req, res);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
    });

    it('debe incluir timestamp en la respuesta', async () => {
      const { req, res } = createMockReqRes('/_health');
      await healthHandler!(req, res);
      expect(res.body).toHaveProperty('time');
      expect(typeof (res.body as Record<string, unknown>).time).toBe('number');
    });

    it('debe responder rápido (< 100ms)', async () => {
      const start = Date.now();
      const { req, res } = createMockReqRes('/_health');
      await healthHandler!(req, res);
      expect(Date.now() - start).toBeLessThan(100);
    });
  });

  describe('GET /_diag → diagnostic.js (standalone Lambda)', () => {
    beforeEach(() => {
      if (!diagHandler) {
        pending('diagnostic.js no disponible. Ejecutar `npm run build` primero.');
      }
    });

    it('debe responder 200 con {"status":"ok"}', async () => {
      const { req, res } = createMockReqRes('/_diag');
      await diagHandler!(req, res);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
    });

    it('debe incluir method, path, headers y env en la respuesta', async () => {
      const { req, res } = createMockReqRes('/_diag', 'POST');
      await diagHandler!(req, res);
      expect(res.body).toHaveProperty('method', 'POST');
      expect(res.body).toHaveProperty('path', '/_diag');
      expect(res.body).toHaveProperty('headers');
      expect(res.body).toHaveProperty('env');
    });

    it('NO debe filtrar secretos en env', async () => {
      const { req, res } = createMockReqRes('/_diag');
      await diagHandler!(req, res);
      const envList = (res.body as Record<string, string[]>).env;
      // El handler filtra por defecto: TOKEN, SECRET, KEY, PASSWORD, DATABASE_URL, REDIS_URL
      expect(envList).toBeDefined();
      expect(Array.isArray(envList)).toBe(true);
      // Verificar que no haya valores sensibles
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
  //  handler.js es el entry point para /api/v1/*. Inicializa NestJS
  //  vía createApp(adapter) y delega requests. Estos tests verifican que
  //  NestJS responde correctamente — es la misma ruta que handler.js usa.
  // ═══════════════════════════════════════════════════════════════════════

  describe('GET /api/v1/health → handler.js → NestJS', () => {
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

  describe('POST /api/v1/auth/login → handler.js → NestJS', () => {
    it('debe loguear admin y retornar tokens JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@tienda.local', password: 'Admin123!' })
        .expect(200);

      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();

      // Verificar que el access token es un JWT válido (3 partes)
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
