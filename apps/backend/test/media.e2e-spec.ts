/**
 * getSignedUrl se mockea ANTES de que se cargue cualquier módulo.
 * ts-jest hoist automáticamente los jest.mock() al inicio del archivo.
 */
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue(
      'https://mock-bucket.s3.amazonaws.com/orders/test/mocked-key',
    ),
}));

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  createTestApp,
  registerWorkshop,
  cleanupWorkshop,
} from './helpers/test-app.helper';

const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

/**
 * Tests e2e para endpoints de media:
 *   POST /work-orders/:orderId/media/upload-url
 *   POST /work-orders/:orderId/media/confirm
 *
 * S3 está mockeado: getSignedUrl retorna una URL ficticia.
 * confirmUpload crea un MediaAsset real en la BD.
 */

describe('Media (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let workshopAId: string;
  let tokenB: string;
  let workshopBId: string;
  let orderId: string; // orden de trabajo del taller A

  const VIN_M = 'MEDATEST000000001'; // 17 chars, sin I/O/Q (reemplaza MEDIA→MEDA)
  const SA = Math.random().toString(36).slice(2, 8);
  const SB = Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    app = await createTestApp();

    ({ token: tokenA, workshopId: workshopAId } = await registerWorkshop(
      app,
      `mdA${SA}`,
    ));
    ({ token: tokenB, workshopId: workshopBId } = await registerWorkshop(
      app,
      `mdB${SB}`,
    ));

    // Crear cliente y orden de trabajo en taller A
    const customerRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Cliente Media', phone: '5550020001' })
      .expect(201);

    const orderRes = await request(app.getHttpServer())
      .post('/work-orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        vin: VIN_M,
        customerId: customerRes.body.id as string,
        items: [
          {
            type: 'SERVICIO',
            description: 'Diagnóstico',
            quantity: 1,
            unitPrice: 0,
          },
        ],
      })
      .expect(201);

    orderId = orderRes.body.id as string;
  });

  afterAll(async () => {
    await cleanupWorkshop(app, workshopAId, [VIN_M]);
    await cleanupWorkshop(app, workshopBId);
    await app.close();
  });

  beforeEach(() => {
    mockedGetSignedUrl.mockClear();
  });

  // ──────────────────────────────────────────────────
  // POST /work-orders/:orderId/media/upload-url
  // ──────────────────────────────────────────────────

  describe('POST /work-orders/:orderId/media/upload-url', () => {
    it('401 → sin token', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/upload-url`)
        .send({ contentType: 'image/jpeg' })
        .expect(401);
    });

    it('200 → devuelve uploadUrl y key para imagen JPEG', async () => {
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/upload-url`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ contentType: 'image/jpeg' })
        .expect(200);

      expect(res.body).toHaveProperty('uploadUrl');
      expect(res.body).toHaveProperty('key');
      expect(typeof res.body.uploadUrl).toBe('string');
      expect(res.body.key).toMatch(/^orders\//);
      expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('200 → funciona para todos los tipos de imagen permitidos', async () => {
      const imageTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ];

      for (const contentType of imageTypes) {
        const res = await request(app.getHttpServer())
          .post(`/work-orders/${orderId}/media/upload-url`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ contentType })
          .expect(200);

        expect(res.body.uploadUrl).toBe(
          'https://mock-bucket.s3.amazonaws.com/orders/test/mocked-key',
        );
      }
    });

    it('200 → funciona para todos los tipos de video permitidos', async () => {
      const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

      for (const contentType of videoTypes) {
        await request(app.getHttpServer())
          .post(`/work-orders/${orderId}/media/upload-url`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ contentType })
          .expect(200);
      }
    });

    it('200 → acepta sizeBytes dentro del límite de imagen (20 MB)', async () => {
      const twentyMB = 20 * 1024 * 1024;
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/upload-url`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ contentType: 'image/png', sizeBytes: twentyMB })
        .expect(200);
    });

    it('400 → imagen excede 20 MB', async () => {
      const overLimit = 20 * 1024 * 1024 + 1;
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/upload-url`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ contentType: 'image/jpeg', sizeBytes: overLimit })
        .expect(400);

      expect(res.body.message).toMatch(/20/);
    });

    it('400 → video excede 200 MB', async () => {
      // El DTO tiene @Max(MAX_BYTES.VIDEO), así que la validación la hace class-validator
      // antes de llegar al servicio (no hay mensaje personalizado en este path)
      const overLimit = 200 * 1024 * 1024 + 1;
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/upload-url`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ contentType: 'video/mp4', sizeBytes: overLimit })
        .expect(400);
    });

    it('400 → contentType no permitido', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/upload-url`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ contentType: 'application/pdf' })
        .expect(400);
    });

    it('400 → falta contentType', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/upload-url`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({})
        .expect(400);
    });

    it('404 → orderId inexistente', async () => {
      await request(app.getHttpServer())
        .post('/work-orders/orden-no-existe/media/upload-url')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ contentType: 'image/jpeg' })
        .expect(404);
    });

    it('404 → taller B no puede obtener upload-url de órdenes del taller A', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/upload-url`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ contentType: 'image/jpeg' })
        .expect(404);
    });
  });

  // ──────────────────────────────────────────────────
  // POST /work-orders/:orderId/media/confirm
  // ──────────────────────────────────────────────────

  describe('POST /work-orders/:orderId/media/confirm', () => {
    const S3_KEY = `orders/${orderId ?? 'placeholder'}/test-uuid-1234`;

    it('401 → sin token', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/confirm`)
        .send({ key: S3_KEY, contentType: 'image/jpeg' })
        .expect(401);
    });

    it('201 → registra MediaAsset de imagen en la BD', async () => {
      const key = `orders/${orderId}/img-${Math.random().toString(36).slice(2)}`;
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/confirm`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ key, contentType: 'image/jpeg', sizeBytes: 512000 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.key).toBe(key);
      expect(res.body.type).toBe('IMAGEN');
      expect(res.body.contentType).toBe('image/jpeg');
      expect(res.body.sizeBytes).toBe(512000);
      expect(res.body.workOrderId).toBe(orderId);
    });

    it('201 → registra MediaAsset de video (tipo VIDEO)', async () => {
      const key = `orders/${orderId}/vid-${Math.random().toString(36).slice(2)}`;
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/confirm`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ key, contentType: 'video/mp4' })
        .expect(201);

      expect(res.body.type).toBe('VIDEO');
    });

    it('201 → sin sizeBytes (campo opcional)', async () => {
      const key = `orders/${orderId}/opt-${Math.random().toString(36).slice(2)}`;
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/confirm`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ key, contentType: 'image/png' })
        .expect(201);

      expect(res.body.sizeBytes).toBeNull();
    });

    it('400 → contentType no permitido', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/confirm`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ key: 'orders/test/key', contentType: 'text/plain' })
        .expect(400);
    });

    it('400 → falta key', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/confirm`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ contentType: 'image/jpeg' })
        .expect(400);
    });

    it('400 → falta contentType', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/confirm`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ key: 'orders/test/key' })
        .expect(400);
    });

    it('404 → orderId inexistente', async () => {
      await request(app.getHttpServer())
        .post('/work-orders/no-existe/media/confirm')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ key: 'orders/no-existe/key', contentType: 'image/jpeg' })
        .expect(404);
    });

    it('404 → taller B no puede confirmar media de órdenes del taller A', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${orderId}/media/confirm`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ key: 'orders/test/key', contentType: 'image/jpeg' })
        .expect(404);
    });
  });
});
