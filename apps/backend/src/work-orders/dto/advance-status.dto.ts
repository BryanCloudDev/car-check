import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../generated/prisma/client';

export class AdvanceStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la orden',
    enum: OrderStatus,
    example: OrderStatus.EN_PROCESO,
  })
  @IsEnum(OrderStatus, {
    message: i18nValidationMessage('validation.workOrder.statusInvalid'),
  })
  status: OrderStatus;
}
