import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { OrderStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
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
        {
          provide: StorageService,
          useValue: { getObject: jest.fn() },
        },
        {
          provide: I18nService,
          useValue: { translate: jest.fn((key: string) => key) },
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

describe('WorkOrdersService.findAll / findOne', () => {
  let service: WorkOrdersService;
  let scopeService: jest.Mocked<WorkshopScopeService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        { provide: PrismaService, useValue: {} },
        { provide: WorkshopScopeService, useValue: { for: jest.fn() } },
        { provide: VehiclesService, useValue: { findOrCreate: jest.fn() } },
        { provide: StorageService, useValue: { getObject: jest.fn() } },
        {
          provide: I18nService,
          useValue: { translate: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get(WorkOrdersService);
    scopeService = module.get(WorkshopScopeService);
  });

  describe('findAll', () => {
    it('lista las órdenes del taller incluyendo relaciones, sin filtro', async () => {
      const orders = [{ id: ORDER_ID, status: OrderStatus.RECIBIDO }];
      const findManyMock = jest.fn().mockResolvedValue(orders);
      (scopeService.for as jest.Mock).mockReturnValue({
        workOrder: { findMany: findManyMock },
      });

      await expect(service.findAll(WORKSHOP_ID)).resolves.toBe(orders);
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          include: { items: true, vehicle: true, customer: true },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('filtra por estado cuando se provee', async () => {
      const findManyMock = jest.fn().mockResolvedValue([]);
      (scopeService.for as jest.Mock).mockReturnValue({
        workOrder: { findMany: findManyMock },
      });

      await service.findAll(WORKSHOP_ID, OrderStatus.EN_PROCESO);

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: OrderStatus.EN_PROCESO } }),
      );
    });
  });

  describe('findOne', () => {
    it('devuelve la orden con relaciones', async () => {
      const order = { id: ORDER_ID, status: OrderStatus.RECIBIDO };
      const findFirstOrThrowMock = jest.fn().mockResolvedValue(order);
      (scopeService.for as jest.Mock).mockReturnValue({
        workOrder: { findFirstOrThrow: findFirstOrThrowMock },
      });

      await expect(service.findOne(WORKSHOP_ID, ORDER_ID)).resolves.toBe(order);
      expect(findFirstOrThrowMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORDER_ID },
          include: { items: true, vehicle: true, customer: true },
        }),
      );
    });

    it('lanza NotFoundException si la orden no existe', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '0',
      });
      (scopeService.for as jest.Mock).mockReturnValue({
        workOrder: { findFirstOrThrow: jest.fn().mockRejectedValue(err) },
      });

      await expect(service.findOne(WORKSHOP_ID, ORDER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

/**
 * PNG 1x1 real: sirve para comprobar que PDFKit acepta el buffer del logo.
 * Un buffer inválido haría que `doc.image` lance y el recibo fallara.
 */
const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
);

describe('WorkOrdersService.getReceipt', () => {
  let service: WorkOrdersService;
  let storage: { getObject: jest.Mock };

  const order = {
    id: ORDER_ID,
    status: OrderStatus.LISTO,
    createdAt: new Date('2026-03-01'),
    serviceDate: new Date('2026-03-02'),
    mileage: 120_000,
    cost: 150,
    notes: 'Cambio de aceite',
    workshop: {
      name: 'Taller El Salvador',
      address: 'Calle Rubén Darío #123, San Salvador',
      nit: '0614-010203-102-1',
      phone: '+503 2222 3333',
      logoKey: null as string | null,
    },
    customer: { name: 'Ana López', phone: '+503 7777 8888', email: null },
    vehicle: {
      vin: 'ABCDEFGH123456789',
      make: 'Toyota',
      model: 'Hilux',
      year: 2020,
      plate: 'P123456',
    },
    items: [
      {
        type: 'SERVICIO',
        description: 'Cambio de aceite',
        quantity: 1,
        unitPrice: 150,
      },
    ],
  };

  function setup(workshopOverrides: Partial<typeof order.workshop> = {}) {
    return Test.createTestingModule({
      providers: [
        WorkOrdersService,
        {
          provide: PrismaService,
          useValue: {
            workOrder: {
              findFirstOrThrow: jest.fn().mockResolvedValue({
                ...order,
                workshop: { ...order.workshop, ...workshopOverrides },
              }),
            },
          },
        },
        { provide: WorkshopScopeService, useValue: { for: jest.fn() } },
        { provide: VehiclesService, useValue: { findOrCreate: jest.fn() } },
        { provide: StorageService, useValue: storage },
        {
          provide: I18nService,
          useValue: { translate: jest.fn((key: string) => key) },
        },
      ],
    }).compile();
  }

  beforeEach(() => {
    storage = { getObject: jest.fn() };
  });

  it('genera un PDF con los datos fiscales aunque el taller no tenga logo', async () => {
    const module = await setup();
    service = module.get(WorkOrdersService);

    const pdf = await service.getReceipt(WORKSHOP_ID, ORDER_ID);

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(storage.getObject).not.toHaveBeenCalled();
  });

  it('embebe el logo cuando el taller tiene uno', async () => {
    storage.getObject.mockResolvedValue(REAL_PNG);
    const module = await setup({ logoKey: 'workshops/ws-1/logo/abc' });
    service = module.get(WorkOrdersService);

    const pdf = await service.getReceipt(WORKSHOP_ID, ORDER_ID);

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(storage.getObject).toHaveBeenCalledWith('workshops/ws-1/logo/abc');
  });

  it('emite el recibo sin logo si S3 falla, en vez de romper la descarga', async () => {
    storage.getObject.mockRejectedValue(new Error('S3 caído'));
    const module = await setup({ logoKey: 'workshops/ws-1/logo/abc' });
    service = module.get(WorkOrdersService);

    const pdf = await service.getReceipt(WORKSHOP_ID, ORDER_ID);

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
