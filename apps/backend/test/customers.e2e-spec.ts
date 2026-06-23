import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  registerWorkshop,
  cleanupWorkshop,
} from './helpers/test-app.helper';

/**
 * Tests e2e para CRUD /customers.
 * Cubre: autenticación, validación, aislamiento multi-tenant, ordenamiento.
 */
describe('Customers (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let workshopAId: string;
  let tokenB: string;
  let workshopBId: string;

  const SA = Math.random().toString(36).slice(2, 8);
  const SB = Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    app = await createTestApp();
    ({ token: tokenA, workshopId: workshopAId } = await registerWorkshop(
      app,
      `cA${SA}`,
    ));
    ({ token: tokenB, workshopId: workshopBId } = await registerWorkshop(
      app,
      `cB${SB}`,
    ));
  });

  afterAll(async () => {
    await cleanupWorkshop(app, workshopAId);
    await cleanupWorkshop(app, workshopBId);
    await app.close();
  });

  // ──────────────────────────────────────────────────
  // GET /customers
  // ──────────────────────────────────────────────────

  describe('GET /customers', () => {
    it('401 → sin token', async () => {
      await request(app.getHttpServer()).get('/customers').expect(401);
    });

    it('200 → lista vacía para taller nuevo', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────
  // POST /customers
  // ──────────────────────────────────────────────────

  describe('POST /customers', () => {
    it('401 → sin token', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({ name: 'Test', phone: '1234567' })
        .expect(401);
    });

    it('201 → crea cliente con todos los campos', async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Juan Pérez',
          phone: '5551234567',
          email: 'juan@example.com',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Juan Pérez',
        phone: '5551234567',
        email: 'juan@example.com',
      });
      expect(res.body).toHaveProperty('id');
      expect(res.body.workshopId).toBe(workshopAId);
    });

    it('201 → crea cliente sin email (campo opcional)', async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'María López', phone: '5557654321' })
        .expect(201);

      expect(res.body.name).toBe('María López');
      expect(res.body.email).toBeNull();
    });

    it('400 → nombre demasiado corto (< 2 chars)', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'A', phone: '5551234567' })
        .expect(400);
    });

    it('400 → teléfono demasiado corto (< 7 chars)', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Nombre Válido', phone: '123' })
        .expect(400);
    });

    it('400 → email con formato inválido', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Nombre Válido',
          phone: '5551234567',
          email: 'no-es-email',
        })
        .expect(400);
    });

    it('400 → falta campo name', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ phone: '5551234567' })
        .expect(400);
    });

    it('400 → falta campo phone', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Nombre Válido' })
        .expect(400);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /customers/:id
  // ──────────────────────────────────────────────────

  describe('GET /customers/:id', () => {
    let customerId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Cliente Para Buscar', phone: '5559876543' })
        .expect(201);
      customerId = res.body.id as string;
    });

    it('401 → sin token', async () => {
      await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .expect(401);
    });

    it('200 → devuelve el cliente correcto', async () => {
      const res = await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.id).toBe(customerId);
      expect(res.body.name).toBe('Cliente Para Buscar');
      expect(res.body.workshopId).toBe(workshopAId);
    });

    it('404 → ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/customers/id-que-no-existe')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('404 → taller B no puede ver clientes del taller A (aislamiento)', async () => {
      await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /customers/:id
  // ──────────────────────────────────────────────────

  describe('PATCH /customers/:id', () => {
    let customerId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Cliente A Actualizar', phone: '5551111111' })
        .expect(201);
      customerId = res.body.id as string;
    });

    it('401 → sin token', async () => {
      await request(app.getHttpServer())
        .patch(`/customers/${customerId}`)
        .send({ name: 'Nuevo Nombre' })
        .expect(401);
    });

    it('200 → actualiza nombre y email; teléfono se mantiene', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Nombre Actualizado', email: 'actualizado@example.com' })
        .expect(200);

      expect(res.body.name).toBe('Nombre Actualizado');
      expect(res.body.email).toBe('actualizado@example.com');
      expect(res.body.phone).toBe('5551111111');
    });

    it('200 → actualización parcial (sólo teléfono)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ phone: '9998887777' })
        .expect(200);

      expect(res.body.phone).toBe('9998887777');
      expect(res.body.name).toBe('Nombre Actualizado'); // sin cambio
    });

    it('404 → ID inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/customers/no-existe')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ phone: '9998887777' }) // body válido; el 404 viene del ID
        .expect(404);
    });

    it('404 → taller B no puede editar clientes del taller A', async () => {
      await request(app.getHttpServer())
        .patch(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hackeado' })
        .expect(404);
    });

    it('400 → nombre demasiado corto en PATCH', async () => {
      await request(app.getHttpServer())
        .patch(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'X' })
        .expect(400);
    });
  });

  // ──────────────────────────────────────────────────
  // DELETE /customers/:id
  // ──────────────────────────────────────────────────

  describe('DELETE /customers/:id', () => {
    let customerId: string;

    // Crear cliente fresco antes de cada test de delete
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Para Eliminar', phone: '5552222222' })
        .expect(201);
      customerId = res.body.id as string;
    });

    it('401 → sin token', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .expect(401);
    });

    it('204 → elimina el cliente', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(204);

      // Verificar que ya no existe
      await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('404 → ID inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/customers/no-existe')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('404 → taller B no puede eliminar clientes del taller A', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  // ──────────────────────────────────────────────────
  // Ordenamiento: GET /customers devuelve en orden ASC por nombre
  // ──────────────────────────────────────────────────

  describe('GET /customers → orden alfabético', () => {
    let wsToken: string;
    let wsId: string;

    beforeAll(async () => {
      const SL = Math.random().toString(36).slice(2, 8);
      ({ token: wsToken, workshopId: wsId } = await registerWorkshop(
        app,
        `ord${SL}`,
      ));

      const names = ['Zebra Cliente', 'Alpha Cliente', 'Mediana Cliente'];
      for (const name of names) {
        await request(app.getHttpServer())
          .post('/customers')
          .set('Authorization', `Bearer ${wsToken}`)
          .send({ name, phone: '1111111' });
      }
    });

    afterAll(async () => {
      await cleanupWorkshop(app, wsId);
    });

    it('devuelve clientes ordenados por nombre ASC', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${wsToken}`)
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body[0].name).toBe('Alpha Cliente');
      expect(res.body[1].name).toBe('Mediana Cliente');
      expect(res.body[2].name).toBe('Zebra Cliente');
    });
  });
});
