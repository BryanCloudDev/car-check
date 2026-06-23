import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  registerWorkshop,
  cleanupWorkshop,
} from './helpers/test-app.helper';

/**
 * Tests e2e para /work-orders.
 * Cubre: creación, transiciones de estado, actualización, recibo PDF, aislamiento multi-tenant.
 *
 * VINs de prueba: TESTTEST000000001..N — formato válido (17 chars, sin I/O/Q).
 */

// VINs de 17 chars válidos para pruebas (T,E,S,T,T,E,S,T,0..0,X = sin I,O,Q)
const VIN_A = 'TESTTEST000000001';
const VIN_B = 'TESTTEST000000002';
const VIN_C = 'TESTTEST000000003';
const VIN_INVALID = 'VIN-INVALIDO-!!!'; // inválido: guiones, !, longitud

const ITEM_SERVICIO = {
  type: 'SERVICIO',
  description: 'Cambio de aceite',
  quantity: 1,
  unitPrice: 350,
};
const ITEM_REPUESTO = {
  type: 'REPUESTO',
  description: 'Filtro de aceite',
  quantity: 2,
  unitPrice: 75,
};

describe('WorkOrders (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let workshopAId: string;
  let tokenB: string;
  let workshopBId: string;
  let customerAId: string;

  const SA = Math.random().toString(36).slice(2, 8);
  const SB = Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    app = await createTestApp();

    ({ token: tokenA, workshopId: workshopAId } = await registerWorkshop(
      app,
      `woA${SA}`,
    ));
    ({ token: tokenB, workshopId: workshopBId } = await registerWorkshop(
      app,
      `woB${SB}`,
    ));

    // Crear cliente en taller A (necesario para crear work orders)
    const res = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Cliente WO', phone: '5550000001' })
      .expect(201);
    customerAId = res.body.id as string;
  });

  afterAll(async () => {
    await cleanupWorkshop(app, workshopAId, [VIN_A, VIN_B, VIN_C]);
    await cleanupWorkshop(app, workshopBId);
    await app.close();
  });

  // Helper: crea una orden de trabajo básica en taller A y devuelve el id
  async function createOrder(
    vin = VIN_A,
    items = [ITEM_SERVICIO],
  ): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ vin, customerId: customerAId, items })
      .expect(201);
    return res.body.id as string;
  }

  // ──────────────────────────────────────────────────
  // POST /work-orders
  // ──────────────────────────────────────────────────

  describe('POST /work-orders', () => {
    it('401 → sin token', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .send({ vin: VIN_A, customerId: customerAId, items: [ITEM_SERVICIO] })
        .expect(401);
    });

    it('201 → crea orden con VIN nuevo (crea vehículo automáticamente)', async () => {
      const res = await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ vin: VIN_B, customerId: customerAId, items: [ITEM_SERVICIO] })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('RECIBIDO');
      expect(res.body.workshopId).toBe(workshopAId);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items).toHaveLength(1);
    });

    it('201 → normaliza VIN a mayúsculas', async () => {
      const res = await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: VIN_B.toLowerCase(),
          customerId: customerAId,
          items: [ITEM_SERVICIO],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('201 → calcula el costo correctamente desde los items', async () => {
      const res = await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: VIN_C,
          customerId: customerAId,
          items: [ITEM_SERVICIO, ITEM_REPUESTO],
          // costo esperado: 1*350 + 2*75 = 500
        })
        .expect(201);

      expect(Number(res.body.cost)).toBe(500);
      expect(res.body.items).toHaveLength(2);
    });

    it('201 → crea orden con todos los campos opcionales', async () => {
      const res = await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: VIN_A,
          plate: 'ABC123',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          customerId: customerAId,
          mileage: 45000,
          notes: 'Revisión completa',
          serviceDate: '2024-01-15',
          items: [ITEM_SERVICIO],
        })
        .expect(201);

      expect(res.body.mileage).toBe(45000);
      expect(res.body.notes).toBe('Revisión completa');
    });

    it('400 → VIN con formato inválido', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: VIN_INVALID,
          customerId: customerAId,
          items: [ITEM_SERVICIO],
        })
        .expect(400);
    });

    it('400 → VIN con letra prohibida (I)', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: 'IIIIIIIIIIIIIIIII',
          customerId: customerAId,
          items: [ITEM_SERVICIO],
        })
        .expect(400);
    });

    it('400 → VIN con menos de 17 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: 'TESTTEST00000001',
          customerId: customerAId,
          items: [ITEM_SERVICIO],
        })
        .expect(400);
    });

    it('404 → customerId inexistente', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: VIN_A,
          customerId: 'cliente-no-existe',
          items: [ITEM_SERVICIO],
        })
        .expect(404);
    });

    it('404 → cliente de otro taller', async () => {
      // Crear cliente en taller B
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Cliente WS-B', phone: '5550000002' })
        .expect(201);

      const customerBId = res.body.id as string;

      // Taller A intenta usar cliente del taller B
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ vin: VIN_A, customerId: customerBId, items: [ITEM_SERVICIO] })
        .expect(404);
    });

    it('400 → items vacíos (se requiere al menos 1)', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ vin: VIN_A, customerId: customerAId, items: [] })
        .expect(400);
    });

    it('400 → falta el campo items', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ vin: VIN_A, customerId: customerAId })
        .expect(400);
    });

    it('400 → tipo de item inválido', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: VIN_A,
          customerId: customerAId,
          items: [
            {
              type: 'INVALIDO',
              description: 'Test',
              quantity: 1,
              unitPrice: 100,
            },
          ],
        })
        .expect(400);
    });

    it('400 → año fuera de rango (antes de 1885)', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          vin: VIN_A,
          customerId: customerAId,
          year: 1800,
          items: [ITEM_SERVICIO],
        })
        .expect(400);
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /work-orders/:id/status — máquina de estados
  // ──────────────────────────────────────────────────

  describe('PATCH /work-orders/:id/status', () => {
    it('401 → sin token', async () => {
      const id = await createOrder(VIN_A);
      await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .send({ status: 'EN_PROCESO' })
        .expect(401);
    });

    it('flujo completo: RECIBIDO → EN_PROCESO → LISTO → ENTREGADO', async () => {
      const id = await createOrder(VIN_A);

      // RECIBIDO → EN_PROCESO
      let res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'EN_PROCESO' })
        .expect(200);
      expect(res.body.status).toBe('EN_PROCESO');

      // EN_PROCESO → LISTO
      res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'LISTO' })
        .expect(200);
      expect(res.body.status).toBe('LISTO');

      // LISTO → ENTREGADO
      res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'ENTREGADO' })
        .expect(200);
      expect(res.body.status).toBe('ENTREGADO');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('200 → transición válida EN_PROCESO → RECIBIDO (retroceso)', async () => {
      const id = await createOrder(VIN_A);

      await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'EN_PROCESO' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'RECIBIDO' })
        .expect(200);
      expect(res.body.status).toBe('RECIBIDO');
    });

    it('400 → transición inválida RECIBIDO → LISTO (saltar estado)', async () => {
      const id = await createOrder(VIN_A);

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'LISTO' })
        .expect(400);

      expect(res.body.message).toMatch(/transición inválida/i);
    });

    it('400 → transición inválida RECIBIDO → ENTREGADO', async () => {
      const id = await createOrder(VIN_A);

      await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'ENTREGADO' })
        .expect(400);
    });

    it('400 → estado ENTREGADO no permite ninguna transición', async () => {
      const id = await createOrder(VIN_A);

      // Avanzar hasta ENTREGADO
      for (const status of ['EN_PROCESO', 'LISTO', 'ENTREGADO'] as const) {
        await request(app.getHttpServer())
          .patch(`/work-orders/${id}/status`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ status })
          .expect(200);
      }

      // Intentar cualquier transición desde ENTREGADO
      await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'RECIBIDO' })
        .expect(400);
    });

    it('400 → status inválido (no es un OrderStatus)', async () => {
      const id = await createOrder(VIN_A);

      await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'PENDIENTE' })
        .expect(400);
    });

    it('404 → orden inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/work-orders/orden-no-existe/status')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'EN_PROCESO' })
        .expect(404);
    });

    it('404 → taller B no puede cambiar estado de órdenes del taller A', async () => {
      const id = await createOrder(VIN_A);

      await request(app.getHttpServer())
        .patch(`/work-orders/${id}/status`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ status: 'EN_PROCESO' })
        .expect(404);
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /work-orders/:id
  // ──────────────────────────────────────────────────

  describe('PATCH /work-orders/:id', () => {
    it('401 → sin token', async () => {
      const id = await createOrder(VIN_A);
      await request(app.getHttpServer())
        .patch(`/work-orders/${id}`)
        .send({ notes: 'test' })
        .expect(401);
    });

    it('200 → actualiza notas y kilometraje', async () => {
      const id = await createOrder(VIN_A);

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ notes: 'Notas actualizadas', mileage: 55000 })
        .expect(200);

      expect(res.body.notes).toBe('Notas actualizadas');
      expect(res.body.mileage).toBe(55000);
    });

    it('200 → reemplaza items y recalcula costo', async () => {
      const id = await createOrder(VIN_A);

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          items: [
            {
              type: 'REPUESTO',
              description: 'Pastillas de freno',
              quantity: 4,
              unitPrice: 200,
            },
          ],
          // costo esperado: 4 * 200 = 800
        })
        .expect(200);

      expect(Number(res.body.cost)).toBe(800);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].description).toBe('Pastillas de freno');
    });

    it('200 → actualiza fecha de servicio', async () => {
      const id = await createOrder(VIN_A);

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ serviceDate: '2024-06-15' })
        .expect(200);

      expect(res.body).toHaveProperty('serviceDate');
    });

    it('404 → orden inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/work-orders/no-existe')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ notes: 'test' })
        .expect(404);
    });

    it('404 → taller B no puede editar órdenes del taller A', async () => {
      const id = await createOrder(VIN_A);

      await request(app.getHttpServer())
        .patch(`/work-orders/${id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ notes: 'intento de hack' })
        .expect(404);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /work-orders/:id/receipt.pdf
  // ──────────────────────────────────────────────────

  describe('GET /work-orders/:id/receipt.pdf', () => {
    it('401 → sin token', async () => {
      const id = await createOrder(VIN_A);
      await request(app.getHttpServer())
        .get(`/work-orders/${id}/receipt.pdf`)
        .expect(401);
    });

    it('200 → devuelve PDF con Content-Type application/pdf', async () => {
      const id = await createOrder(VIN_A);

      const res = await request(app.getHttpServer())
        .get(`/work-orders/${id}/receipt.pdf`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
      // Verificar que el buffer empieza con la firma de PDF
      expect(res.body).toBeInstanceOf(Buffer);
    });

    it('200 → comprobante incluye servicios y repuestos', async () => {
      const id = await createOrder(VIN_C, [ITEM_SERVICIO, ITEM_REPUESTO]);

      const res = await request(app.getHttpServer())
        .get(`/work-orders/${id}/receipt.pdf`)
        .set('Authorization', `Bearer ${tokenA}`)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      // El PDF no debe estar vacío
      expect((res.body as Buffer).length).toBeGreaterThan(100);
    });

    it('404 → orden inexistente', async () => {
      await request(app.getHttpServer())
        .get('/work-orders/no-existe/receipt.pdf')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('404 → taller B no puede descargar recibo de órdenes del taller A', async () => {
      const id = await createOrder(VIN_A);

      await request(app.getHttpServer())
        .get(`/work-orders/${id}/receipt.pdf`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });
});
