import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/test-app.helper';

/**
 * Tests e2e para POST /auth/register y POST /auth/login.
 * Cubre: happy path, duplicados, validación de campos, credenciales inválidas.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Sufijo único por ejecución para no colisionar con otras corridas
  const S = Math.random().toString(36).slice(2, 8);
  const workshopIdsToClean: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    for (const id of workshopIdsToClean) {
      await prisma.workOrder.deleteMany({ where: { workshopId: id } });
      await prisma.workshop.delete({ where: { id } }).catch(() => {
        /* ya eliminado */
      });
    }
    await app.close();
  });

  // Payload base de registro para este suite
  const base = {
    workshopName: `Auth WS ${S}`,
    workshopEmail: `auth.ws.${S}@test.invalid`,
    adminName: `Auth Admin ${S}`,
    adminEmail: `auth.admin.${S}@test.invalid`,
    adminPassword: 'password123',
  };

  // Helper para extraer workshopId del JWT y añadirlo al cleanup
  function trackFromToken(token: string) {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    ) as { sub: string; workshopId: string; role: string; email: string };
    workshopIdsToClean.push(payload.workshopId);
    return payload;
  }

  // ──────────────────────────────────────────────────
  // POST /auth/register
  // ──────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('201 → devuelve accessToken al registrar un taller nuevo', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(base)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');

      const payload = trackFromToken(res.body.accessToken as string);
      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('workshopId');
      expect(payload.role).toBe('ADMIN');
    });

    it('409 → email de taller duplicado', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...base,
          // mismo workshopEmail que el test anterior
          adminEmail: `auth.admin2.${S}@test.invalid`,
        })
        .expect(409);

      expect(res.body.statusCode).toBe(409);
      expect(res.body.message).toMatch(/taller/i);
    });

    it('409 → email de admin duplicado', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...base,
          workshopEmail: `auth.ws2.${S}@test.invalid`,
          // mismo adminEmail que el test anterior
        })
        .expect(409);
    });

    it('400 → email de taller inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...base,
          workshopEmail: 'no-es-un-email',
          workshopName: `Otro WS ${S}`,
          adminEmail: `auth.admin3.${S}@test.invalid`,
        })
        .expect(400);
    });

    it('400 → contraseña demasiado corta (< 8 chars)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...base,
          workshopEmail: `auth.ws3.${S}@test.invalid`,
          adminEmail: `auth.admin4.${S}@test.invalid`,
          adminPassword: 'short',
        })
        .expect(400);
    });

    it('400 → campos requeridos faltantes (sólo workshopName)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ workshopName: 'Solo nombre' })
        .expect(400);
    });

    it('400 → body vacío', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);
    });
  });

  // ──────────────────────────────────────────────────
  // POST /auth/login
  // ──────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('200 → devuelve accessToken con credenciales correctas', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: base.adminEmail, password: base.adminPassword })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');

      const payload = JSON.parse(
        Buffer.from(res.body.accessToken.split('.')[1], 'base64url').toString(),
      ) as Record<string, unknown>;
      expect(payload.email).toBe(base.adminEmail);
      expect(payload.role).toBe('ADMIN');
      expect(payload).toHaveProperty('workshopId');
    });

    it('401 → contraseña incorrecta', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: base.adminEmail, password: 'wrong-password' })
        .expect(401);

      expect(res.body.message).toMatch(/credenciales/i);
    });

    it('401 → email inexistente', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nadie@test.invalid', password: 'password123' })
        .expect(401);
    });

    it('400 → falta email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('400 → falta password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'alguien@test.invalid' })
        .expect(400);
    });

    it('400 → body vacío', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });
});
