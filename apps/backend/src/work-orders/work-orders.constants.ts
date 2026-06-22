import { OrderStatus } from '../../generated/prisma/client';

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECIBIDO: [OrderStatus.EN_PROCESO],
  EN_PROCESO: [OrderStatus.LISTO, OrderStatus.RECIBIDO],
  LISTO: [OrderStatus.ENTREGADO],
  ENTREGADO: [],
};
