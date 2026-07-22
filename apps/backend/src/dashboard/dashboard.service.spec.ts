import { Test } from '@nestjs/testing';
import { Prisma, OrderStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

const WORKSHOP_ID = 'ws-1';

function makePrismaMock() {
  return {
    workOrder: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

describe('DashboardService.getMetrics', () => {
  let service: DashboardService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('agrupa las órdenes activas por estado y completa con 0 los faltantes', async () => {
    prisma.workOrder.groupBy.mockResolvedValue([
      { status: OrderStatus.RECIBIDO, _count: { _all: 3 } },
      { status: OrderStatus.LISTO, _count: { _all: 2 } },
    ]);
    prisma.workOrder.aggregate.mockResolvedValue({ _sum: { cost: null } });
    prisma.workOrder.findMany.mockResolvedValue([]);

    const result = await service.getMetrics(WORKSHOP_ID);

    expect(result.activeOrdersByStatus).toEqual({
      RECIBIDO: 3,
      EN_PROCESO: 0,
      LISTO: 2,
    });
    expect(result.activeOrdersTotal).toBe(5);
  });

  it('solo cuenta estados activos, nunca ENTREGADO', async () => {
    prisma.workOrder.groupBy.mockResolvedValue([]);
    prisma.workOrder.aggregate.mockResolvedValue({ _sum: { cost: null } });
    prisma.workOrder.findMany.mockResolvedValue([]);

    await service.getMetrics(WORKSHOP_ID);

    expect(prisma.workOrder.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workshopId: WORKSHOP_ID,
          status: {
            in: [
              OrderStatus.RECIBIDO,
              OrderStatus.EN_PROCESO,
              OrderStatus.LISTO,
            ],
          },
        }),
      }),
    );
  });

  it('suma solo órdenes ENTREGADO para los ingresos y convierte Decimal a number', async () => {
    prisma.workOrder.groupBy.mockResolvedValue([]);
    prisma.workOrder.aggregate
      .mockResolvedValueOnce({ _sum: { cost: new Prisma.Decimal(150.5) } })
      .mockResolvedValueOnce({ _sum: { cost: new Prisma.Decimal(4200) } });
    prisma.workOrder.findMany.mockResolvedValue([]);

    const result = await service.getMetrics(WORKSHOP_ID);

    expect(result.revenue).toEqual({ day: 150.5, month: 4200 });
    expect(prisma.workOrder.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workshopId: WORKSHOP_ID,
          status: OrderStatus.ENTREGADO,
        }),
      }),
    );
  });

  it('devuelve 0 de ingresos cuando no hay órdenes entregadas', async () => {
    prisma.workOrder.groupBy.mockResolvedValue([]);
    prisma.workOrder.aggregate.mockResolvedValue({ _sum: { cost: null } });
    prisma.workOrder.findMany.mockResolvedValue([]);

    const result = await service.getMetrics(WORKSHOP_ID);

    expect(result.revenue).toEqual({ day: 0, month: 0 });
  });

  it('mapea las órdenes LISTO a la forma readyForPickup', async () => {
    prisma.workOrder.groupBy.mockResolvedValue([]);
    prisma.workOrder.aggregate.mockResolvedValue({ _sum: { cost: null } });
    prisma.workOrder.findMany.mockResolvedValue([
      {
        id: 'order-1',
        cost: new Prisma.Decimal(320),
        serviceDate: new Date('2026-07-21T00:00:00.000Z'),
        customer: { name: 'Juan Pérez' },
        vehicle: {
          vin: '1HGCM82633A004352',
          plate: 'ABC-123',
          make: 'Honda',
          model: 'Civic',
        },
      },
    ]);

    const result = await service.getMetrics(WORKSHOP_ID);

    expect(result.readyForPickup).toEqual([
      {
        id: 'order-1',
        customerName: 'Juan Pérez',
        cost: 320,
        serviceDate: '2026-07-21T00:00:00.000Z',
        vehicle: {
          vin: '1HGCM82633A004352',
          plate: 'ABC-123',
          make: 'Honda',
          model: 'Civic',
        },
      },
    ]);
    expect(prisma.workOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workshopId: WORKSHOP_ID, status: OrderStatus.LISTO },
      }),
    );
  });
});
