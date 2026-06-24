import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { VehiclesService } from './vehicles.service';

const WORKSHOP_ID = 'ws-1';
const VEHICLE_ID = 'vehicle-1';
const VALID_VIN = 'WBA3A5G59DNP26082';
const INVALID_VIN = 'INVALID_VIN_123';

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: 'test',
  });
}

describe('VehiclesService', () => {
  let service: VehiclesService;
  const findUniqueMock = jest.fn();
  const findManyMock = jest.fn();
  const createMock = jest.fn();
  const updateMock = jest.fn();
  const upsertMock = jest.fn();
  const forMock = jest.fn();

  beforeEach(async () => {
    findUniqueMock.mockReset();
    findManyMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    upsertMock.mockReset();
    forMock.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: {
            vehicle: {
              findUnique: findUniqueMock,
              findMany: findManyMock,
              create: createMock,
              update: updateMock,
              upsert: upsertMock,
            },
          },
        },
        {
          provide: WorkshopScopeService,
          useValue: { for: forMock },
        },
      ],
    }).compile();

    service = module.get(VehiclesService);
  });

  describe('create', () => {
    it('crea el vehículo con los datos recibidos', async () => {
      const created = { id: VEHICLE_ID, vin: VALID_VIN };
      createMock.mockResolvedValue(created);

      const result = await service.create({ vin: VALID_VIN });

      expect(createMock).toHaveBeenCalledWith({ data: { vin: VALID_VIN } });
      expect(result).toBe(created);
    });

    it('lanza ConflictException si el VIN ya existe', async () => {
      createMock.mockRejectedValue(
        knownError(PrismaErrorCode.UNIQUE_VIOLATION),
      );

      await expect(service.create({ vin: VALID_VIN })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('search', () => {
    it('lista todos los vehículos cuando no hay término', async () => {
      const vehicles = [{ id: VEHICLE_ID, vin: VALID_VIN }];
      findManyMock.mockResolvedValue(vehicles);

      const result = await service.search('   ');

      expect(findManyMock).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe(vehicles);
    });

    it('busca por VIN exacto (normalizado) cuando el término tiene forma de VIN', async () => {
      const vehicle = { id: VEHICLE_ID, vin: VALID_VIN };
      findUniqueMock.mockResolvedValue(vehicle);

      const result = await service.search(`  ${VALID_VIN.toLowerCase()}  `);

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { vin: VALID_VIN },
      });
      expect(result).toEqual([vehicle]);
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it('devuelve arreglo vacío si el VIN no existe', async () => {
      findUniqueMock.mockResolvedValue(null);

      const result = await service.search(VALID_VIN);

      expect(result).toEqual([]);
    });

    it('busca por placa (sin distinción de mayúsculas) cuando no es un VIN', async () => {
      const vehicles = [{ id: VEHICLE_ID, vin: VALID_VIN, plate: 'ABC-123' }];
      findManyMock.mockResolvedValue(vehicles);

      const result = await service.search('abc-123');

      expect(findManyMock).toHaveBeenCalledWith({
        where: { plate: { equals: 'abc-123', mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe(vehicles);
      expect(findUniqueMock).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreate', () => {
    it('lanza BadRequestException si el VIN tiene formato inválido', async () => {
      await expect(service.findOrCreate({ vin: INVALID_VIN })).rejects.toThrow(
        BadRequestException,
      );
      expect(upsertMock).not.toHaveBeenCalled();
    });

    it('crea el vehículo cuando el VIN no existe (VIN normalizado)', async () => {
      const vehicle = { id: VEHICLE_ID, vin: VALID_VIN };
      upsertMock.mockResolvedValue(vehicle);

      const result = await service.findOrCreate({
        vin: VALID_VIN.toLowerCase(),
        plate: 'ABC-123',
        make: 'Honda',
        model: 'Civic',
        year: 2020,
        mileage: 45000,
      });

      expect(upsertMock).toHaveBeenCalledWith({
        where: { vin: VALID_VIN },
        update: { plate: 'ABC-123', mileage: 45000 },
        create: {
          vin: VALID_VIN,
          plate: 'ABC-123',
          make: 'Honda',
          model: 'Civic',
          year: 2020,
          mileage: 45000,
        },
      });
      expect(result).toBe(vehicle);
    });

    it('reutiliza el vehículo existente y solo refresca placa y kilometraje', async () => {
      const vehicle = { id: VEHICLE_ID, vin: VALID_VIN };
      upsertMock.mockResolvedValue(vehicle);

      await service.findOrCreate({ vin: VALID_VIN });

      expect(upsertMock).toHaveBeenCalledWith({
        where: { vin: VALID_VIN },
        update: { plate: undefined, mileage: undefined },
        create: {
          vin: VALID_VIN,
          plate: undefined,
          make: undefined,
          model: undefined,
          year: undefined,
          mileage: undefined,
        },
      });
    });
  });

  describe('findOne', () => {
    it('lanza BadRequestException si el VIN tiene formato inválido', async () => {
      await expect(service.findOne(INVALID_VIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza NotFoundException si el vehículo no existe', async () => {
      findUniqueMock.mockResolvedValue(null);

      await expect(service.findOne(VALID_VIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('normaliza el VIN (mayúsculas/espacios) antes de buscar', async () => {
      const vehicle = { id: VEHICLE_ID, vin: VALID_VIN };
      findUniqueMock.mockResolvedValue(vehicle);

      const result = await service.findOne(`  ${VALID_VIN.toLowerCase()}  `);

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { vin: VALID_VIN },
      });
      expect(result).toBe(vehicle);
    });
  });

  describe('update', () => {
    it('lanza BadRequestException si el VIN tiene formato inválido', async () => {
      await expect(
        service.update(INVALID_VIN, { mileage: 1000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('actualiza el vehículo por VIN normalizado', async () => {
      const updated = { id: VEHICLE_ID, vin: VALID_VIN, mileage: 1000 };
      updateMock.mockResolvedValue(updated);

      const result = await service.update(VALID_VIN.toLowerCase(), {
        mileage: 1000,
      });

      expect(updateMock).toHaveBeenCalledWith({
        where: { vin: VALID_VIN },
        data: { mileage: 1000 },
      });
      expect(result).toBe(updated);
    });

    it('lanza NotFoundException si el vehículo no existe', async () => {
      updateMock.mockRejectedValue(knownError(PrismaErrorCode.NOT_FOUND));

      await expect(
        service.update(VALID_VIN, { plate: 'ABC-123' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistory', () => {
    it('lanza BadRequestException si el VIN tiene formato inválido', async () => {
      await expect(
        service.getHistory(WORKSHOP_ID, INVALID_VIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si el vehículo no existe', async () => {
      findUniqueMock.mockResolvedValue(null);

      await expect(service.getHistory(WORKSHOP_ID, VALID_VIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve órdenes del taller ordenadas cronológicamente', async () => {
      const orders = [
        { id: 'o-1', serviceDate: new Date('2024-01-10'), items: [] },
        { id: 'o-2', serviceDate: new Date('2024-03-05'), items: [] },
      ];
      const findManyMock = jest.fn().mockResolvedValue(orders);

      findUniqueMock.mockResolvedValue({ id: VEHICLE_ID, vin: VALID_VIN });
      forMock.mockReturnValue({ workOrder: { findMany: findManyMock } });

      const result = await service.getHistory(WORKSHOP_ID, VALID_VIN);

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vehicleId: VEHICLE_ID },
          orderBy: [{ serviceDate: 'asc' }, { createdAt: 'asc' }],
          include: { items: true },
        }),
      );
      expect(result).toBe(orders);
    });

    it('devuelve arreglo vacío si el vehículo existe pero no tiene órdenes en el taller', async () => {
      findUniqueMock.mockResolvedValue({ id: VEHICLE_ID, vin: VALID_VIN });
      forMock.mockReturnValue({
        workOrder: { findMany: jest.fn().mockResolvedValue([]) },
      });

      const result = await service.getHistory(WORKSHOP_ID, VALID_VIN);

      expect(result).toEqual([]);
    });
  });
});
