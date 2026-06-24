import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  registerWorkshop,
  cleanupWorkshop,
} from './helpers/test-app.helper';

const SUF = String(Math.floor(Math.random() * 1e9)).padStart(9, '0');

const VIN_1 = `SRCHA${SUF}001`;
const VIN_2 = `SRCHA${SUF}002`;
const VIN_ABSENT = `SRCHA${SUF}999`;

const PLATE_1 = `SR-${SUF}-1`;
const PLATE_2 = `SR-${SUF}-2`;

describe('Vehicles Search (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let workshopId: string;

  const S = Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    app = await createTestApp();

    ({ token, workshopId } = await registerWorkshop(app, `vs${S}`));

    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ vin: VIN_1, plate: PLATE_1, make: 'Honda', model: 'Civic' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ vin: VIN_2, plate: PLATE_2, make: 'Toyota', model: 'Corolla' })
      .expect(201);
  });

  afterAll(async () => {
    await cleanupWorkshop(app, workshopId, [VIN_1, VIN_2]);
    await app.close();
  });

  describe('GET /vehicles', () => {
    it('401 → sin token', async () => {
      await request(app.getHttpServer()).get('/vehicles').expect(401);
    });

    it('200 → sin query devuelve una lista que incluye los vehículos creados', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const vins = (res.body as Array<{ vin: string }>).map((v) => v.vin);
      expect(vins).toContain(VIN_1);
      expect(vins).toContain(VIN_2);
    });

    it('200 → busca por VIN exacto devuelve sólo ese vehículo', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .query({ q: VIN_1 })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as Array<{ vin: string }>;
      expect(body).toHaveLength(1);
      expect(body[0].vin).toBe(VIN_1);
    });

    it('200 → búsqueda por VIN es case-insensitive', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .query({ q: VIN_1.toLowerCase() })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = res.body as Array<{ vin: string }>;
      expect(body).toHaveLength(1);
      expect(body[0].vin).toBe(VIN_1);
    });

    it('200 → VIN con formato válido pero inexistente devuelve lista vacía', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .query({ q: VIN_ABSENT })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('200 → busca por placa devuelve el vehículo correspondiente', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .query({ q: PLATE_1 })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const match = (res.body as Array<{ vin: string; plate: string }>).find(
        (v) => v.vin === VIN_1,
      );
      expect(match).toBeDefined();
      expect(match?.plate).toBe(PLATE_1);
    });

    it('200 → búsqueda por placa es case-insensitive', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .query({ q: PLATE_1.toLowerCase() })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const vins = (res.body as Array<{ vin: string }>).map((v) => v.vin);
      expect(vins).toContain(VIN_1);
    });

    it('200 → placa inexistente devuelve lista vacía', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .query({ q: `NOPLATE-${SUF}` })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });
});
