import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  registerWorkshop,
  createMechanic,
  cleanupWorkshop,
} from './helpers/test-app.helper';

describe('Roles / RBAC (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let mechanicToken: string;
  let workshopId: string;

  const S = Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    app = await createTestApp();
    ({ token: adminToken, workshopId } = await registerWorkshop(
      app,
      `roles${S}`,
    ));
    ({ token: mechanicToken } = await createMechanic(app, workshopId, S));
  });

  afterAll(async () => {
    await cleanupWorkshop(app, workshopId);
    await app.close();
  });

  describe('GET /auth/me', () => {
    it('401 → sin token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('200 → expone role ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ role: 'ADMIN', workshopId });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('200 → expone role MECANICO', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ role: 'MECANICO', workshopId });
    });
  });

  describe('GET /dashboard', () => {
    it('200 → ADMIN accede', async () => {
      await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('403 → MECANICO no accede', async () => {
      await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .expect(403);
    });
  });

  describe('DELETE /customers/:id', () => {
    let customerId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cliente Borrable', phone: '1234567' })
        .expect(201);
      customerId = (res.body as { id: string }).id;
    });

    it('403 → MECANICO no puede borrar (y el cliente sigue existiendo)', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${mechanicToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('204 → ADMIN sí puede borrar', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
