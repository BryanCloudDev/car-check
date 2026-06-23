import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../generated/prisma/client';

export class AdvanceStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la orden',
    enum: OrderStatus,
    example: OrderStatus.EN_PROCESO,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
