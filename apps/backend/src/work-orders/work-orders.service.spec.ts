import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WorkOrdersService } from './work-orders.service';

const WORKSHOP_ID = 'ws-1';
const ORDER_ID = 'order-1';

function makeScopeMock(order: { id: string; status: OrderStatus }) {
  const updateMock = jest.fn().mockResolvedValue({ ...order });
  const findFirstOrThrowMock = jest.fn().mockResolvedValue(order);

  const scopedPrisma = {
    customer: { findFirstOrThrow: jest.fn() },
    workOrder: {
      findFirstOrThrow: findFirstOrThrowMock,
      update: updateMock,
      create: jest.fn(),
    },
  };

  return {
    scopedPrisma,
    updateMock,
    findFirstOrThrowMock,
  };
}

describe('WorkOrdersService.advanceStatus', () => {
  let service: WorkOrdersService;
  let scopeService: jest.Mocked<WorkshopScopeService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        {
          provide: PrismaService,
          useValue: { vehicle: { upsert: jest.fn() } },
        },
        {
          provide: WorkshopScopeService,
          useValue: { for: jest.fn() },
        },
        {
          provide: VehiclesService,
          useValue: { findOrCreate: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(WorkOrdersService);
    scopeService = module.get(WorkshopScopeService);
  });

  describe('transiciones válidas', () => {
    it.each([
      [OrderStatus.RECIBIDO, OrderStatus.EN_PROCESO],
      [OrderStatus.EN_PROCESO, OrderStatus.LISTO],
      [OrderStatus.EN_PROCESO, OrderStatus.RECIBIDO],
      [OrderStatus.LISTO, OrderStatus.ENTREGADO],
    ])('%s → %s actualiza el estado', async (from, to) => {
      const { scopedPrisma, updateMock } = makeScopeMock({
        id: ORDER_ID,
        status: from,
      });
      (scopeService.for as jest.Mock).mockReturnValue(scopedPrisma);

      await service.advanceStatus(WORKSHOP_ID, ORDER_ID, { status: to });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORDER_ID },
          data: { status: to },
        }),
      );
    });
  });

  describe('transiciones inválidas', () => {
    it.each([
      [OrderStatus.RECIBIDO, OrderStatus.LISTO],
      [OrderStatus.RECIBIDO, OrderStatus.ENTREGADO],
      [OrderStatus.EN_PROCESO, OrderStatus.ENTREGADO],
      [OrderStatus.LISTO, OrderStatus.RECIBIDO],
      [OrderStatus.LISTO, OrderStatus.EN_PROCESO],
      [OrderStatus.ENTREGADO, OrderStatus.RECIBIDO],
      [OrderStatus.ENTREGADO, OrderStatus.EN_PROCESO],
      [OrderStatus.ENTREGADO, OrderStatus.LISTO],
    ])('%s → %s lanza BadRequestException', async (from, to) => {
      const { scopedPrisma } = makeScopeMock({ id: ORDER_ID, status: from });
      (scopeService.for as jest.Mock).mockReturnValue(scopedPrisma);

      await expect(
        service.advanceStatus(WORKSHOP_ID, ORDER_ID, { status: to }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  it('lanza NotFoundException si la orden no existe', async () => {
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '0',
    });

    const scopedPrisma = {
      workOrder: { findFirstOrThrow: jest.fn().mockRejectedValue(err) },
    };
    (scopeService.for as jest.Mock).mockReturnValue(scopedPrisma);

    await expect(
      service.advanceStatus(WORKSHOP_ID, ORDER_ID, {
        status: OrderStatus.EN_PROCESO,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
