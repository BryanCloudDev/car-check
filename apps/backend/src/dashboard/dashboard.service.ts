import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACTIVE_ORDER_STATUSES,
  DashboardResponse,
} from './dto/dashboard.response';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(workshopId: string): Promise<DashboardResponse> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [grouped, dayAgg, monthAgg, readyOrders] = await Promise.all([
      this.prisma.workOrder.groupBy({
        by: ['status'],
        where: { workshopId, status: { in: ACTIVE_ORDER_STATUSES } },
        _count: { _all: true },
      }),
      this.revenueSince(workshopId, startOfDay),
      this.revenueSince(workshopId, startOfMonth),
      this.prisma.workOrder.findMany({
        where: { workshopId, status: OrderStatus.LISTO },
        orderBy: [{ serviceDate: 'asc' }, { createdAt: 'asc' }],
        include: {
          vehicle: {
            select: { vin: true, plate: true, make: true, model: true },
          },
          customer: { select: { name: true } },
        },
      }),
    ]);

    const activeOrdersByStatus = {
      RECIBIDO: 0,
      EN_PROCESO: 0,
      LISTO: 0,
    };
    for (const row of grouped) {
      if (row.status in activeOrdersByStatus) {
        activeOrdersByStatus[row.status as keyof typeof activeOrdersByStatus] =
          row._count._all;
      }
    }
    const activeOrdersTotal =
      activeOrdersByStatus.RECIBIDO +
      activeOrdersByStatus.EN_PROCESO +
      activeOrdersByStatus.LISTO;

    return {
      activeOrdersByStatus,
      activeOrdersTotal,
      revenue: { day: dayAgg, month: monthAgg },
      readyForPickup: readyOrders.map((order) => ({
        id: order.id,
        customerName: order.customer.name,
        vehicle: {
          vin: order.vehicle.vin,
          plate: order.vehicle.plate,
          make: order.vehicle.make,
          model: order.vehicle.model,
        },
        cost: Number(order.cost),
        serviceDate: order.serviceDate.toISOString(),
      })),
    };
  }

  private async revenueSince(workshopId: string, from: Date): Promise<number> {
    const agg = await this.prisma.workOrder.aggregate({
      where: {
        workshopId,
        status: OrderStatus.ENTREGADO,
        serviceDate: { gte: from },
      },
      _sum: { cost: true },
    });
    return agg._sum.cost ? Number(agg._sum.cost) : 0;
  }
}
