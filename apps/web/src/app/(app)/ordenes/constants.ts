import type { OrderStatus } from '@car-check/shared';

export const STATUS_STYLES: Record<OrderStatus, string> = {
  RECIBIDO: 'bg-gray-100 text-gray-700',
  EN_PROCESO: 'bg-amber-100 text-amber-700',
  LISTO: 'bg-blue-100 text-blue-700',
  ENTREGADO: 'bg-green-100 text-green-700',
};

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECIBIDO: ['EN_PROCESO'],
  EN_PROCESO: ['LISTO', 'RECIBIDO'],
  LISTO: ['ENTREGADO'],
  ENTREGADO: [],
};

export const ORDER_STATUSES: OrderStatus[] = [
  'RECIBIDO',
  'EN_PROCESO',
  'LISTO',
  'ENTREGADO',
];
