import type { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Thin wrapper around PrismaService that automatically injects `workshopId`
 * into every read/write on tenant-private models.
 *
 * Vehicle is intentionally absent: it is a global entity indexed by VIN (RNF-07).
 * Use PrismaService directly for vehicle queries.
 */
export class ScopedPrisma {
  constructor(
    private readonly prisma: PrismaService,
    readonly workshopId: string,
  ) {}

  /* ------------------------------------------------------------------ *
   * Customer – tenant-private                                           *
   * ------------------------------------------------------------------ */

  readonly customer = {
    findMany: (args: Prisma.CustomerFindManyArgs = {}) =>
      this.prisma.customer.findMany({
        ...(args as object),
        where: { ...args.where, workshopId: this.workshopId },
      } as Prisma.CustomerFindManyArgs),

    findFirstOrThrow: (args: Prisma.CustomerFindFirstOrThrowArgs = {}) =>
      this.prisma.customer.findFirstOrThrow({
        ...(args as object),
        where: { ...args.where, workshopId: this.workshopId },
      } as Prisma.CustomerFindFirstOrThrowArgs),

    create: (
      args: Omit<Prisma.CustomerCreateArgs, 'data'> & {
        data: Omit<Prisma.CustomerUncheckedCreateInput, 'workshopId'>;
      },
    ) =>
      this.prisma.customer.create({
        ...(args as object),
        data: { ...args.data, workshopId: this.workshopId },
      } as Prisma.CustomerCreateArgs),

    update: (
      args: Omit<Prisma.CustomerUpdateArgs, 'where' | 'data'> & {
        where: { id: string };
        data: Prisma.CustomerUncheckedUpdateInput;
      },
    ) =>
      this.prisma.customer.update({
        ...(args as object),
        where: { id: args.where.id, workshopId: this.workshopId },
        data: args.data,
      } as Prisma.CustomerUpdateArgs),

    delete: (
      args: Omit<Prisma.CustomerDeleteArgs, 'where'> & { where: { id: string } },
    ) =>
      this.prisma.customer.delete({
        ...(args as object),
        where: { id: args.where.id, workshopId: this.workshopId },
      } as Prisma.CustomerDeleteArgs),
  };

  /* ------------------------------------------------------------------ *
   * WorkOrder – tenant-private                                          *
   * ------------------------------------------------------------------ */

  readonly workOrder = {
    findMany: (args: Prisma.WorkOrderFindManyArgs = {}) =>
      this.prisma.workOrder.findMany({
        ...(args as object),
        where: { ...args.where, workshopId: this.workshopId },
      } as Prisma.WorkOrderFindManyArgs),

    findFirstOrThrow: (args: Prisma.WorkOrderFindFirstOrThrowArgs = {}) =>
      this.prisma.workOrder.findFirstOrThrow({
        ...(args as object),
        where: { ...args.where, workshopId: this.workshopId },
      } as Prisma.WorkOrderFindFirstOrThrowArgs),

    create: (
      args: Omit<Prisma.WorkOrderCreateArgs, 'data'> & {
        data: Omit<Prisma.WorkOrderUncheckedCreateInput, 'workshopId'>;
      },
    ) =>
      this.prisma.workOrder.create({
        ...(args as object),
        data: { ...args.data, workshopId: this.workshopId },
      } as Prisma.WorkOrderCreateArgs),

    update: (
      args: Omit<Prisma.WorkOrderUpdateArgs, 'where' | 'data'> & {
        where: { id: string };
        data: Prisma.WorkOrderUncheckedUpdateInput;
      },
    ) =>
      this.prisma.workOrder.update({
        ...(args as object),
        where: { id: args.where.id, workshopId: this.workshopId },
        data: args.data,
      } as Prisma.WorkOrderUpdateArgs),

    delete: (
      args: Omit<Prisma.WorkOrderDeleteArgs, 'where'> & { where: { id: string } },
    ) =>
      this.prisma.workOrder.delete({
        ...(args as object),
        where: { id: args.where.id, workshopId: this.workshopId },
      } as Prisma.WorkOrderDeleteArgs),
  };
}
