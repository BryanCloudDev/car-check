import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { WorkshopsService } from './workshops.service';

const WORKSHOP_ID = 'ws-1';
const LOGO_PREFIX = `workshops/${WORKSHOP_ID}/logo/`;
const SIGNED_URL = 'https://bucket.s3.amazonaws.com/signed';

const WORKSHOP_ROW = {
  id: WORKSHOP_ID,
  name: 'Taller El Salvador',
  email: 'contacto@taller.sv',
  phone: '+503 2222 3333',
  address: 'Calle Rubén Darío #123',
  nit: '0614-010203-102-1',
  logoKey: null as string | null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
};

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: '7.0.0',
  });
}

function makePrismaMock() {
  return {
    workshop: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
  };
}

function makeStorageMock() {
  return {
    createUploadUrl: jest.fn().mockResolvedValue(SIGNED_URL),
    createDownloadUrl: jest.fn().mockResolvedValue(SIGNED_URL),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    getObject: jest.fn(),
  };
}

describe('WorkshopsService', () => {
  let service: WorkshopsService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let storage: ReturnType<typeof makeStorageMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    storage = makeStorageMock();
    const module = await Test.createTestingModule({
      providers: [
        WorkshopsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(WorkshopsService);
  });

  describe('findOne', () => {
    it('nunca expone logoKey y firma la URL cuando hay logo', async () => {
      prisma.workshop.findUniqueOrThrow.mockResolvedValue({
        ...WORKSHOP_ROW,
        logoKey: `${LOGO_PREFIX}abc`,
      });

      const result = await service.findOne(WORKSHOP_ID);

      expect(result).not.toHaveProperty('logoKey');
      expect(result.logoUrl).toBe(SIGNED_URL);
      expect(storage.createDownloadUrl).toHaveBeenCalledWith(
        `${LOGO_PREFIX}abc`,
      );
    });

    it('devuelve logoUrl null y no firma nada si el taller no tiene logo', async () => {
      prisma.workshop.findUniqueOrThrow.mockResolvedValue(WORKSHOP_ROW);

      const result = await service.findOne(WORKSHOP_ID);

      expect(result.logoUrl).toBeNull();
      expect(storage.createDownloadUrl).not.toHaveBeenCalled();
    });

    it('traduce P2025 a 404', async () => {
      prisma.workshop.findUniqueOrThrow.mockRejectedValue(
        prismaError(PrismaErrorCode.NOT_FOUND),
      );

      await expect(service.findOne(WORKSHOP_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('recorta los valores y sólo manda los campos presentes', async () => {
      prisma.workshop.update.mockResolvedValue(WORKSHOP_ROW);

      await service.update(WORKSHOP_ID, {
        name: '  Taller Nuevo  ',
        nit: ' 0614-010203-102-1 ',
      });

      expect(prisma.workshop.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: WORKSHOP_ID },
          data: { name: 'Taller Nuevo', nit: '0614-010203-102-1' },
        }),
      );
    });

    it('convierte cadena vacía en null para limpiar el campo', async () => {
      prisma.workshop.update.mockResolvedValue(WORKSHOP_ROW);

      await service.update(WORKSHOP_ID, { address: '   ', phone: null });

      expect(prisma.workshop.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { address: null, phone: null } }),
      );
    });

    it('traduce el email duplicado a 409', async () => {
      prisma.workshop.update.mockRejectedValue(
        prismaError(PrismaErrorCode.UNIQUE_VIOLATION),
      );

      await expect(
        service.update(WORKSHOP_ID, { email: 'ya@existe.sv' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createLogoUploadUrl', () => {
    it('firma una key bajo el prefijo del taller', async () => {
      prisma.workshop.findUnique.mockResolvedValue({ id: WORKSHOP_ID });

      const result = await service.createLogoUploadUrl(WORKSHOP_ID, {
        contentType: 'image/png',
      });

      expect(result.key.startsWith(LOGO_PREFIX)).toBe(true);
      expect(result.uploadUrl).toBe(SIGNED_URL);
      expect(storage.createUploadUrl).toHaveBeenCalledWith(
        result.key,
        'image/png',
      );
    });

    it('falla con 404 si el taller no existe', async () => {
      prisma.workshop.findUnique.mockResolvedValue(null);

      await expect(
        service.createLogoUploadUrl(WORKSHOP_ID, { contentType: 'image/png' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmLogo', () => {
    it('rechaza una key de otro taller sin tocar la base', async () => {
      await expect(
        service.confirmLogo(WORKSHOP_ID, {
          key: 'workshops/ws-otro/logo/robado',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.workshop.update).not.toHaveBeenCalled();
    });

    it('guarda la key nueva y borra el logo anterior', async () => {
      const key = `${LOGO_PREFIX}nuevo`;
      prisma.workshop.findUniqueOrThrow.mockResolvedValue({
        logoKey: `${LOGO_PREFIX}viejo`,
      });
      prisma.workshop.update.mockResolvedValue({
        ...WORKSHOP_ROW,
        logoKey: key,
      });

      await service.confirmLogo(WORKSHOP_ID, { key });

      expect(prisma.workshop.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { logoKey: key } }),
      );
      expect(storage.deleteObject).toHaveBeenCalledWith(`${LOGO_PREFIX}viejo`);
    });

    it('no borra nada si la key es la misma que ya estaba', async () => {
      const key = `${LOGO_PREFIX}igual`;
      prisma.workshop.findUniqueOrThrow.mockResolvedValue({ logoKey: key });
      prisma.workshop.update.mockResolvedValue({
        ...WORKSHOP_ROW,
        logoKey: key,
      });

      await service.confirmLogo(WORKSHOP_ID, { key });

      expect(storage.deleteObject).not.toHaveBeenCalled();
    });

    it('la operación sobrevive si S3 no puede borrar el logo viejo', async () => {
      const key = `${LOGO_PREFIX}nuevo`;
      prisma.workshop.findUniqueOrThrow.mockResolvedValue({
        logoKey: `${LOGO_PREFIX}viejo`,
      });
      prisma.workshop.update.mockResolvedValue({
        ...WORKSHOP_ROW,
        logoKey: key,
      });
      storage.deleteObject.mockRejectedValue(new Error('S3 caído'));

      await expect(
        service.confirmLogo(WORKSHOP_ID, { key }),
      ).resolves.toMatchObject({ logoUrl: SIGNED_URL });
    });
  });

  describe('removeLogo', () => {
    it('limpia logoKey y borra el objeto', async () => {
      prisma.workshop.findUniqueOrThrow.mockResolvedValue({
        logoKey: `${LOGO_PREFIX}viejo`,
      });
      prisma.workshop.update.mockResolvedValue(WORKSHOP_ROW);

      const result = await service.removeLogo(WORKSHOP_ID);

      expect(prisma.workshop.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { logoKey: null } }),
      );
      expect(storage.deleteObject).toHaveBeenCalledWith(`${LOGO_PREFIX}viejo`);
      expect(result.logoUrl).toBeNull();
    });

    it('es idempotente si no había logo', async () => {
      prisma.workshop.findUniqueOrThrow.mockResolvedValue({ logoKey: null });
      prisma.workshop.update.mockResolvedValue(WORKSHOP_ROW);

      await service.removeLogo(WORKSHOP_ID);

      expect(storage.deleteObject).not.toHaveBeenCalled();
    });
  });
});
