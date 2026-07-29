import { OrderStatus } from '../../generated/prisma/client';

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECIBIDO: [OrderStatus.EN_PROCESO],
  EN_PROCESO: [OrderStatus.LISTO, OrderStatus.RECIBIDO],
  LISTO: [OrderStatus.ENTREGADO],
  ENTREGADO: [],
};

/** Caja (en puntos PDF) donde se encaja el logo del taller en el recibo. */
export const RECEIPT_LOGO_FIT = { width: 120, height: 60 } as const;
