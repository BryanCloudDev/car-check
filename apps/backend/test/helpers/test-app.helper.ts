import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  I18nService,
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const i18n: I18nService = app.get(I18nService);
  app.useGlobalPipes(
    new I18nValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(
    new HttpExceptionFilter(i18n),
    new I18nValidationExceptionFilter({
      detailedErrors: false,
      responseBodyFormatter: (_host, exc, formattedErrors) => ({
        statusCode: exc.getStatus(),
        error: 'Solicitud inválida',
        message: formattedErrors,
      }),
    }),
  );
  await app.init();
  return app;
}

/**
 * Registra un taller + admin y devuelve el JWT y el workshopId.
 * El suffix debe ser único por suite para evitar conflictos.
 */
export async function registerWorkshop(
  app: INestApplication,
  suffix: string,
): Promise<{ token: string; workshopId: string }> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      workshopName: `Test Workshop ${suffix}`,
      workshopEmail: `ws.${suffix}@test.invalid`,
      adminName: `Admin ${suffix}`,
      adminEmail: `admin.${suffix}@test.invalid`,
      adminPassword: 'password123',
    })
    .expect(201);

  const token = (res.body as { accessToken: string }).accessToken;
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString(),
  ) as { workshopId: string };

  return { token, workshopId: payload.workshopId };
}

/**
 * Elimina todos los datos del taller: primero work orders (con cascade a items/media),
 * luego el workshop mismo (con cascade a usuarios y clientes).
 * Los vehículos son globales: se eliminan sólo si se provee la lista de VINs.
 */
export async function cleanupWorkshop(
  app: INestApplication,
  workshopId: string,
  testVins: string[] = [],
): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.workOrder.deleteMany({ where: { workshopId } });
  await prisma.workshop.delete({ where: { id: workshopId } });
  if (testVins.length > 0) {
    await prisma.vehicle.deleteMany({ where: { vin: { in: testVins } } });
  }
}
