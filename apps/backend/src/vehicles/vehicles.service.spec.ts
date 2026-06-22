import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { VehiclesService } from './vehicles.service';

const WORKSHOP_ID = 'ws-1';
const VEHICLE_ID = 'vehicle-1';
const VALID_VIN = 'WBA3A5G59DNP26082';
const INVALID_VIN = 'INVALID_VIN_123';

describe('VehiclesService.getHistory', () => {
  let service: VehiclesService;
  let prisma: jest.Mocked<PrismaService>;
  let scopeService: jest.Mocked<WorkshopScopeService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: { vehicle: { findUnique: jest.fn() } },
        },
        {
          provide: WorkshopScopeService,
          useValue: { for: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(VehiclesService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    scopeService = module.get(WorkshopScopeService) as jest.Mocked<WorkshopScopeService>;
  });

  it('lanza BadRequestException si el VIN tiene formato inválido', async () => {
    await expect(
      service.getHistory(WORKSHOP_ID, INVALID_VIN),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza NotFoundException si el vehículo no existe', async () => {
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.getHistory(WORKSHOP_ID, VALID_VIN),
    ).rejects.toThrow(NotFoundException);
  });

  it('devuelve órdenes del taller ordenadas cronológicamente', async () => {
    const orders = [
      { id: 'o-1', serviceDate: new Date('2024-01-10'), items: [] },
      { id: 'o-2', serviceDate: new Date('2024-03-05'), items: [] },
    ];
    const findManyMock = jest.fn().mockResolvedValue(orders);

    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue({
      id: VEHICLE_ID,
      vin: VALID_VIN,
    });
    (scopeService.for as jest.Mock).mockReturnValue({
      workOrder: { findMany: findManyMock },
    });

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
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue({
      id: VEHICLE_ID,
      vin: VALID_VIN,
    });
    (scopeService.for as jest.Mock).mockReturnValue({
      workOrder: { findMany: jest.fn().mockResolvedValue([]) },
    });

    const result = await service.getHistory(WORKSHOP_ID, VALID_VIN);

    expect(result).toEqual([]);
  });
});
