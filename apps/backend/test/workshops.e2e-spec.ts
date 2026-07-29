/**
 * getSignedUrl se mockea ANTES de que se cargue cualquier módulo.
 * ts-jest hoist automáticamente los jest.mock() al inicio del archivo.
 */
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://mock-bucket.s3.amazonaws.com/signed'),
}));

/**
 * A diferencia de los tests de media, acá sí se ejecutan comandos S3 reales
 * (el borrado del logo anterior), así que se apaga el cliente por completo.
 */
jest.mock('@aws-sdk/client-s3', () => ({
  ...jest.requireActual('@aws-sdk/client-s3'),
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
}));

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  registerWorkshop,
  createMechanic,
  cleanupWorkshop,
} from './helpers/test-app.helper';

/**
 * Tests e2e del perfil del taller:
 *   GET    /workshops/me
 *   PATCH  /workshops/me            (solo ADMIN)
 *   POST   /workshops/me/logo/upload-url  (solo ADMIN)
 *   POST   /workshops/me/logo/confirm     (solo ADMIN)
 *   DELETE /workshops/me/logo             (solo ADMIN)
 *
 * S3 está mockeado: getSignedUrl devuelve una URL ficticia.
 */
describe('Workshops (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let mechanicToken: string;
  let workshopId: string;
  let otherWorkshopId: string;

  const S = Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    app = await createTestApp();
    ({ token: adminToken, workshopId } = await registerWorkshop(
      app,
      `wsA${S}`,
    ));
    ({ token: mechanicToken } = await createMechanic(
      app,
      workshopId,
      `ws${S}`,
    ));
    ({ workshopId: otherWorkshopId } = await registerWorkshop(app, `wsB${S}`));
  });

  afterAll(async () => {
    await cleanupWorkshop(app, workshopId);
    await cleanupWorkshop(app, otherWorkshopId);
    await app.close();
  });

  describe('GET /workshops/me', () => {
    it('401 → sin token', async () => {
      await request(app.getHttpServer()).get('/workshops/me').expect(401);
    });

    it('200 → devuelve el perfil sin exponer logoKey', async () => {
      const res = await request(app.getHttpServer())
        .get('/workshops/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: workshopId, logoUrl: null });
      expect(res.body).not.toHaveProperty('logoKey');
    });

    it('200 → un MECANICO también puede leerlo (el nombre se muestra en la UI)', async () => {
      await request(app.getHttpServer())
        .get('/workshops/me')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .expect(200);
    });
  });

  describe('PATCH /workshops/me', () => {
    it('200 → ADMIN guarda dirección y NIT', async () => {
      const res = await request(app.getHttpServer())
        .patch('/workshops/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          address: 'Calle Rubén Darío #123, San Salvador',
          nit: '0614-010203-102-1',
          phone: '+503 2222 3333',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        address: 'Calle Rubén Darío #123, San Salvador',
        nit: '0614-010203-102-1',
        phone: '+503 2222 3333',
      });
    });

    it('200 → acepta un DUI como NIT (persona natural en El Salvador)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/workshops/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nit: '12345678-9' })
        .expect(200);

      expect(res.body.nit).toBe('12345678-9');
    });

    it('200 → null limpia el campo', async () => {
      const res = await request(app.getHttpServer())
        .patch('/workshops/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ address: null })
        .expect(200);

      expect(res.body.address).toBeNull();
    });

    it('403 → un MECANICO no puede editar', async () => {
      await request(app.getHttpServer())
        .patch('/workshops/me')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .send({ name: 'Taller Secuestrado' })
        .expect(403);
    });

    it('400 → nombre demasiado corto', async () => {
      await request(app.getHttpServer())
        .patch('/workshops/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'a' })
        .expect(400);
    });

    it('400 → email inválido', async () => {
      await request(app.getHttpServer())
        .patch('/workshops/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'no-es-un-email' })
        .expect(400);
    });

    it('409 → el email ya lo usa otro taller', async () => {
      await request(app.getHttpServer())
        .patch('/workshops/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `ws.wsB${S}@test.invalid` })
        .expect(409);
    });
  });

  describe('Logo', () => {
    let issuedKey: string;

    it('200 → ADMIN obtiene una URL de carga con key bajo su propio prefijo', async () => {
      const res = await request(app.getHttpServer())
        .post('/workshops/me/logo/upload-url')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contentType: 'image/png', sizeBytes: 4096 })
        .expect(200);

      issuedKey = res.body.key as string;
      expect(issuedKey.startsWith(`workshops/${workshopId}/logo/`)).toBe(true);
      expect(res.body.uploadUrl).toContain('https://');
    });

    it('400 → rechaza un formato que el PDF no puede embeber', async () => {
      await request(app.getHttpServer())
        .post('/workshops/me/logo/upload-url')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contentType: 'image/webp' })
        .expect(400);
    });

    it('400 → rechaza un logo que supera los 2 MB', async () => {
      await request(app.getHttpServer())
        .post('/workshops/me/logo/upload-url')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contentType: 'image/png', sizeBytes: 3 * 1024 * 1024 })
        .expect(400);
    });

    it('403 → un MECANICO no puede pedir URL de carga', async () => {
      await request(app.getHttpServer())
        .post('/workshops/me/logo/upload-url')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .send({ contentType: 'image/png' })
        .expect(403);
    });

    it('400 → no se puede confirmar una key del prefijo de otro taller', async () => {
      await request(app.getHttpServer())
        .post('/workshops/me/logo/confirm')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ key: `workshops/${otherWorkshopId}/logo/robado` })
        .expect(400);
    });

    it('200 → confirma el logo y lo devuelve firmado', async () => {
      const res = await request(app.getHttpServer())
        .post('/workshops/me/logo/confirm')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ key: issuedKey })
        .expect(200);

      expect(res.body.logoUrl).toContain('https://');
      expect(res.body).not.toHaveProperty('logoKey');
    });

    it('200 → DELETE deja el taller sin logo', async () => {
      const res = await request(app.getHttpServer())
        .delete('/workshops/me/logo')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.logoUrl).toBeNull();
    });

    it('403 → un MECANICO no puede quitar el logo', async () => {
      await request(app.getHttpServer())
        .delete('/workshops/me/logo')
        .set('Authorization', `Bearer ${mechanicToken}`)
        .expect(403);
    });
  });
});
