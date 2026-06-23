import { ScopedPrisma } from './scoped-prisma';

const WORKSHOP_A = 'workshop-aaa';
const WORKSHOP_B = 'workshop-bbb';

/** Minimal stub that tracks every call made to each Prisma model method. */
function buildPrismaStub() {
  const makeDelegate = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findFirstOrThrow: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  });

  return {
    customer: makeDelegate(),
    workOrder: makeDelegate(),
  };
}

type PrismaStub = ReturnType<typeof buildPrismaStub>;

describe('ScopedPrisma', () => {
  let prisma: PrismaStub;
  let scoped: ScopedPrisma;

  beforeEach(() => {
    prisma = buildPrismaStub();
    scoped = new ScopedPrisma(prisma as any, WORKSHOP_A);
  });

  // ── customer ────────────────────────────────────────────────────────────

  describe('customer.findMany', () => {
    it('injects workshopId when called with no args', async () => {
      await scoped.customer.findMany();
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workshopId: WORKSHOP_A }),
        }),
      );
    });

    it('merges caller where with workshopId', async () => {
      await scoped.customer.findMany({ where: { name: 'John' } });
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workshopId: WORKSHOP_A,
            name: 'John',
          }),
        }),
      );
    });

    it('overrides any workshopId the caller passes', async () => {
      await scoped.customer.findMany({
        where: { workshopId: WORKSHOP_B } as any,
      });
      const { where } = prisma.customer.findMany.mock.calls[0][0];
      expect(where.workshopId).toBe(WORKSHOP_A);
    });

    it('passes through extra args (orderBy, skip, take)', async () => {
      await scoped.customer.findMany({
        orderBy: { name: 'asc' },
        skip: 10,
        take: 5,
      });
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
          skip: 10,
          take: 5,
        }),
      );
    });
  });

  describe('customer.findFirstOrThrow', () => {
    it('injects workshopId into where', async () => {
      await scoped.customer.findFirstOrThrow({ where: { id: 'cust-1' } });
      expect(prisma.customer.findFirstOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'cust-1',
            workshopId: WORKSHOP_A,
          }),
        }),
      );
    });

    it('overrides a rogue workshopId from caller', async () => {
      await scoped.customer.findFirstOrThrow({
        where: { workshopId: WORKSHOP_B } as any,
      });
      const { where } = prisma.customer.findFirstOrThrow.mock.calls[0][0];
      expect(where.workshopId).toBe(WORKSHOP_A);
    });
  });

  describe('customer.create', () => {
    it('injects workshopId into data', async () => {
      await scoped.customer.create({ data: { name: 'Ana', phone: '555' } });
      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Ana',
            phone: '555',
            workshopId: WORKSHOP_A,
          }),
        }),
      );
    });

    it('cannot be overridden by caller data', async () => {
      await scoped.customer.create({
        data: { name: 'Ana', phone: '555', workshopId: WORKSHOP_B } as any,
      });
      const { data } = prisma.customer.create.mock.calls[0][0];
      expect(data.workshopId).toBe(WORKSHOP_A);
    });
  });

  describe('customer.update', () => {
    it('scopes where to the correct workshop', async () => {
      await scoped.customer.update({
        where: { id: 'cust-1' },
        data: { name: 'Updated' },
      });
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-1', workshopId: WORKSHOP_A },
        }),
      );
    });

    it('passes data through unchanged', async () => {
      const data = { name: 'Updated', phone: '999' };
      await scoped.customer.update({ where: { id: 'cust-1' }, data });
      const call = prisma.customer.update.mock.calls[0][0];
      expect(call.data).toMatchObject(data);
    });
  });

  describe('customer.delete', () => {
    it('scopes where to the correct workshop', async () => {
      await scoped.customer.delete({ where: { id: 'cust-1' } });
      expect(prisma.customer.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-1', workshopId: WORKSHOP_A },
        }),
      );
    });
  });

  // ── workOrder ────────────────────────────────────────────────────────────

  describe('workOrder.findMany', () => {
    it('injects workshopId when called with no args', async () => {
      await scoped.workOrder.findMany();
      expect(prisma.workOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workshopId: WORKSHOP_A }),
        }),
      );
    });

    it('merges caller where with workshopId', async () => {
      await scoped.workOrder.findMany({ where: { status: 'RECIBIDO' } });
      expect(prisma.workOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workshopId: WORKSHOP_A,
            status: 'RECIBIDO',
          }),
        }),
      );
    });

    it('overrides any workshopId the caller passes', async () => {
      await scoped.workOrder.findMany({
        where: { workshopId: WORKSHOP_B } as any,
      });
      const { where } = prisma.workOrder.findMany.mock.calls[0][0];
      expect(where.workshopId).toBe(WORKSHOP_A);
    });
  });

  describe('workOrder.findFirstOrThrow', () => {
    it('injects workshopId into where', async () => {
      await scoped.workOrder.findFirstOrThrow({ where: { id: 'wo-1' } });
      expect(prisma.workOrder.findFirstOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'wo-1',
            workshopId: WORKSHOP_A,
          }),
        }),
      );
    });
  });

  describe('workOrder.create', () => {
    it('injects workshopId into data', async () => {
      const data = { vehicleId: 'v-1', customerId: 'c-1' };
      await scoped.workOrder.create({ data });
      expect(prisma.workOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ...data, workshopId: WORKSHOP_A }),
        }),
      );
    });

    it('cannot be overridden by caller data', async () => {
      await scoped.workOrder.create({
        data: {
          vehicleId: 'v-1',
          customerId: 'c-1',
          workshopId: WORKSHOP_B,
        } as any,
      });
      const { data } = prisma.workOrder.create.mock.calls[0][0];
      expect(data.workshopId).toBe(WORKSHOP_A);
    });
  });

  describe('workOrder.update', () => {
    it('scopes where to the correct workshop', async () => {
      await scoped.workOrder.update({
        where: { id: 'wo-1' },
        data: { status: 'LISTO' },
      });
      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wo-1', workshopId: WORKSHOP_A },
        }),
      );
    });
  });

  describe('workOrder.delete', () => {
    it('scopes where to the correct workshop', async () => {
      await scoped.workOrder.delete({ where: { id: 'wo-1' } });
      expect(prisma.workOrder.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wo-1', workshopId: WORKSHOP_A },
        }),
      );
    });
  });

  // ── cross-workshop isolation ─────────────────────────────────────────────

  describe('cross-workshop isolation', () => {
    it('two scoped instances never share workshopId', async () => {
      const scopedB = new ScopedPrisma(prisma as any, WORKSHOP_B);

      await scoped.customer.findMany();
      await scopedB.customer.findMany();

      const [callA, callB] = prisma.customer.findMany.mock.calls;
      expect(callA[0].where.workshopId).toBe(WORKSHOP_A);
      expect(callB[0].where.workshopId).toBe(WORKSHOP_B);
    });

    it('workOrder.create from workshop A never writes workshopId B', async () => {
      const scopedB = new ScopedPrisma(prisma as any, WORKSHOP_B);

      await scoped.workOrder.create({
        data: { vehicleId: 'v', customerId: 'c' },
      });
      await scopedB.workOrder.create({
        data: { vehicleId: 'v', customerId: 'c' },
      });

      const [callA, callB] = prisma.workOrder.create.mock.calls;
      expect(callA[0].data.workshopId).toBe(WORKSHOP_A);
      expect(callB[0].data.workshopId).toBe(WORKSHOP_B);
    });
  });
});
