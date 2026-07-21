import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../../generated/prisma/client';

export class SearchWorkOrdersDto {
  @ApiPropertyOptional({
    description:
      'Filtrar por estado de la orden. Si se omite, devuelve todas las órdenes del taller.',
    enum: OrderStatus,
    example: OrderStatus.EN_PROCESO,
  })
  @IsEnum(OrderStatus, {
    message: i18nValidationMessage('validation.workOrder.statusInvalid'),
  })
  @IsOptional()
  status?: OrderStatus;
}
