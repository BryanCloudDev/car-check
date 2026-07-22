import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../generated/prisma/client';

export class ActiveOrdersByStatus {
  @ApiProperty({ description: 'Órdenes en estado RECIBIDO', example: 3 })
  RECIBIDO: number;

  @ApiProperty({ description: 'Órdenes en estado EN_PROCESO', example: 5 })
  EN_PROCESO: number;

  @ApiProperty({ description: 'Órdenes en estado LISTO', example: 2 })
  LISTO: number;
}

export class DashboardRevenue {
  @ApiProperty({
    description: 'Ingresos del día (órdenes entregadas hoy).',
    example: 450.75,
  })
  day: number;

  @ApiProperty({
    description: 'Ingresos del mes en curso (órdenes entregadas este mes).',
    example: 12480.5,
  })
  month: number;
}

export class ReadyForPickupVehicle {
  @ApiProperty({ example: '1HGCM82633A004352' })
  vin: string;

  @ApiProperty({ nullable: true, example: 'ABC-123' })
  plate: string | null;

  @ApiProperty({ nullable: true, example: 'Honda' })
  make: string | null;

  @ApiProperty({ nullable: true, example: 'Civic' })
  model: string | null;
}

export class ReadyForPickupOrder {
  @ApiProperty({ description: 'ID de la orden', example: 'clx...' })
  id: string;

  @ApiProperty({ description: 'Nombre del cliente', example: 'Juan Pérez' })
  customerName: string;

  @ApiProperty({ type: ReadyForPickupVehicle })
  vehicle: ReadyForPickupVehicle;

  @ApiProperty({ description: 'Total de la orden', example: 320.0 })
  cost: number;

  @ApiProperty({
    description: 'Fecha de servicio (ISO 8601)',
    example: '2026-07-21T00:00:00.000Z',
  })
  serviceDate: string;
}

export class DashboardResponse {
  @ApiProperty({
    type: ActiveOrdersByStatus,
    description: 'Conteo de órdenes activas agrupadas por estado.',
  })
  activeOrdersByStatus: ActiveOrdersByStatus;

  @ApiProperty({
    description: 'Total de órdenes activas (RECIBIDO + EN_PROCESO + LISTO).',
    example: 10,
  })
  activeOrdersTotal: number;

  @ApiProperty({ type: DashboardRevenue })
  revenue: DashboardRevenue;

  @ApiProperty({
    type: [ReadyForPickupOrder],
    description: 'Órdenes en estado LISTO, listas para entregar.',
  })
  readyForPickup: ReadyForPickupOrder[];
}

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.RECIBIDO,
  OrderStatus.EN_PROCESO,
  OrderStatus.LISTO,
];
