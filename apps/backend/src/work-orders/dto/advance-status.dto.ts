import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../generated/prisma/client';

export class AdvanceStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
