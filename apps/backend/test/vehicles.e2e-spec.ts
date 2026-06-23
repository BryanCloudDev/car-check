import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  registerWorkshop,
  cleanupWorkshop,
} from './helpers/test-app.helper';

/**
 * Tests e2e para GET /vehicles/:vin/history.
 * Cubre: validación de VIN, vehículo inexistente, historial cronológico,
 *        aislamiento multi-tenant (sólo órdenes del taller autenticado).
 */

const VIN_H1 = 'HJSTTEST000000001'; // H,J,S,T,T,E,S,T,0... → válido (sin I/O/Q)
const VIN_H2 = 'HJSTTEST000000002';
const VIN_NEVER = 'NEVEREXST00000001'; // este VIN nunca se crea (17 chars, sin I/O/Q)

// VIN con I (inválido)
const VIN_WITH_I = 'IIIIIIIIIIIIIIIIII';
// VIN demasiado corto
const VIN_SHORT = 'TESTTEST0000001';

describe('Vehicles History (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let workshopAId: string;
  let tokenB: string;
  let workshopBId: string;
  let customerAId: string;
  let customerBId: string;

  const SA = Math.random().toString(36).slice(2, 8);
  const SB = Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    app = await createTestApp();

    ({ token: tokenA, workshopId: workshopAId } = await registerWorkshop(
      app,
      `vhA${SA}`,
    ));
    ({ token: tokenB, workshopId: workshopBId } = await registerWorkshop(
      app,
      `vhB${SB}`,
    ));

    // Clientes para cada taller
    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Cliente VH-A', phone: '5550010001' })
        .expect(201),
      request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Cliente VH-B', phone: '5550010002' })
        .expect(201),
    ]);
    customerAId = resA.body.id as string;
    customerBId = resB.body.id as string;

    // Crear 2 órdenes en taller A sobre VIN_H1 (para probar historial)
    await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        vin: VIN_H1,
        customerId: customerAId,
        serviceDate: '2024-01-10',
        items: [
          {
            type: 'SERVICIO',
            description: 'Primera revisión',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        vin: VIN_H1,
        customerId: customerAId,
        serviceDate: '2024-06-20',
        items: [
          {
            type: 'REPUESTO',
            description: 'Amortiguadores',
            quantity: 2,
            unitPrice: 400,
          },
        ],
      })
      .expect(201);

    // Crear 1 orden en taller B sobre el mismo VIN_H1 (para probar aislamiento)
    await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        vin: VIN_H1,
        customerId: customerBId,
        serviceDate: '2024-03-15',
        items: [
          {
            type: 'SERVICIO',
            description: 'Servicio taller B',
            quantity: 1,
            unitPrice: 200,
          },
        ],
      })
      .expect(201);

    // Crear orden en taller A para VIN_H2 (para probar que VIN_H1 no la incluye)
    await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        vin: VIN_H2,
        customerId: customerAId,
        items: [
          {
            type: 'SERVICIO',
            description: 'Orden VIN distinto',
            quantity: 1,
            unitPrice: 50,
          },
        ],
      })
      .expect(201);
  });

  afterAll(async () => {
    // Los vehículos son entidades globales — no se borran (evita conflictos de FK con
    // otras suites o corridas anteriores que fallen sin cleanup). Las work orders se
    // limpian por workshopId y eso es suficiente para el aislamiento.
    await cleanupWorkshop(app, workshopAId);
    await cleanupWorkshop(app, workshopBId);
    await app.close();
  });

  // ──────────────────────────────────────────────────
  // GET /vehicles/:vin/history
  // ──────────────────────────────────────────────────

  describe('GET /vehicles/:vin/history', () => {
    it('401 → sin token', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${VIN_H1}/history`)
        .expect(401);
    });

    it('200 → devuelve historial del VIN para el taller autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get(`/vehicles/${VIN_H1}/history`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2); // sólo las 2 órdenes del taller A
    });

    it('devuelve las órdenes con sus items incluidos', async () => {
      const res = await request(app.getHttpServer())
        .get(`/vehicles/${VIN_H1}/history`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      for (const order of res.body) {
        expect(Array.isArray(order.items)).toBe(true);
        expect(order.workshopId).toBe(workshopAId);
      }
    });

    it('devuelve las órdenes en orden cronológico ASC por serviceDate', async () => {
      const res = await request(app.getHttpServer())
        .get(`/vehicles/${VIN_H1}/history`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const [first, second] = res.body as Array<{ serviceDate: string }>;
      expect(new Date(first.serviceDate).getTime()).toBeLessThanOrEqual(
        new Date(second.serviceDate).getTime(),
      );
    });

    it('aislamiento: taller B sólo ve su propia orden del VIN_H1', async () => {
      const res = await request(app.getHttpServer())
        .get(`/vehicles/${VIN_H1}/history`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].workshopId).toBe(workshopBId);
    });

    it('200 → lista vacía si el vehículo no tiene órdenes en este taller', async () => {
      // VIN_H2 sólo tiene órdenes en taller A; taller B no tiene órdenes con ese VIN
      const res = await request(app.getHttpServer())
        .get(`/vehicles/${VIN_H2}/history`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('400 → VIN con letra inválida (I)', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${VIN_WITH_I}/history`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);
    });

    it('400 → VIN demasiado corto', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${VIN_SHORT}/history`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);
    });

    it('400 → VIN con caracteres especiales', async () => {
      await request(app.getHttpServer())
        .get('/vehicles/VIN-INVALIDO-123/history')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);
    });

    it('404 → VIN nunca registrado en ningún taller', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${VIN_NEVER}/history`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });
});
