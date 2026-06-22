import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { AdvanceStatusDto } from './dto/advance-status.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { VALID_TRANSITIONS } from './work-orders.constants';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: WorkshopScopeService,
  ) {}

  async create(workshopId: string, dto: CreateWorkOrderDto) {
    const {
      vin,
      plate,
      make,
      model,
      year,
      customerId,
      mileage,
      notes,
      serviceDate,
      items,
    } = dto;

    // Validate customer belongs to workshop
    try {
      await this.scope
        .for(workshopId)
        .customer.findFirstOrThrow({ where: { id: customerId } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PrismaErrorCode.NOT_FOUND
      ) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw e;
    }

    // Find-or-create vehicle by VIN (global entity, no workshopId)
    const vehicle = await this.prisma.vehicle.upsert({
      where: { vin },
      update: {},
      create: { vin, plate, make, model, year },
    });

    // Compute cost from items
    const cost = items.reduce(
      (sum, item) => sum + (item.quantity ?? 1) * (item.unitPrice ?? 0),
      0,
    );

    return this.scope.for(workshopId).workOrder.create({
      data: {
        vehicleId: vehicle.id,
        customerId,
        mileage,
        notes,
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        cost,
        items: {
          createMany: {
            data: items.map((item) => ({
              type: item.type,
              description: item.description,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice ?? 0,
            })),
          },
        },
      },
      include: { items: true },
    });
  }

  async advanceStatus(workshopId: string, id: string, dto: AdvanceStatusDto) {
    const order = await this.scope
      .for(workshopId)
      .workOrder.findFirstOrThrow({ where: { id } })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === PrismaErrorCode.NOT_FOUND
        ) {
          throw new NotFoundException('Orden no encontrada');
        }
        throw e;
      });

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transición inválida: ${order.status} → ${dto.status}`,
      );
    }

    return this.scope.for(workshopId).workOrder.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true },
    });
  }

  async update(workshopId: string, id: string, dto: UpdateWorkOrderDto) {
    const { mileage, notes, serviceDate, items } = dto;

    const data: Prisma.WorkOrderUncheckedUpdateInput = {
      ...(mileage !== undefined && { mileage }),
      ...(notes !== undefined && { notes }),
      ...(serviceDate !== undefined && { serviceDate: new Date(serviceDate) }),
    };

    if (items !== undefined) {
      data.cost = items.reduce(
        (sum, item) => sum + (item.quantity ?? 1) * (item.unitPrice ?? 0),
        0,
      );
      data.items = {
        deleteMany: {},
        createMany: {
          data: items.map((item) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0,
          })),
        },
      };
    }

    try {
      return await this.scope.for(workshopId).workOrder.update({
        where: { id },
        data,
        include: { items: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PrismaErrorCode.NOT_FOUND
      ) {
        throw new NotFoundException('Orden no encontrada');
      }
      throw e;
    }
  }
}
