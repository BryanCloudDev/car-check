import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItemType } from '../../../generated/prisma/client';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Tipo de ítem',
    enum: OrderItemType,
    example: OrderItemType.SERVICIO,
  })
  @IsEnum(OrderItemType, {
    message: i18nValidationMessage('validation.workOrder.itemTypeInvalid'),
  })
  type: OrderItemType;

  @ApiProperty({
    description: 'Descripción del servicio o repuesto',
    example: 'Cambio de aceite 5W-30',
  })
  @IsString({
    message: i18nValidationMessage('validation.workOrder.itemDescriptionText'),
  })
  @MinLength(1, {
    message: i18nValidationMessage(
      'validation.workOrder.itemDescriptionRequired',
    ),
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Cantidad (default: 1)',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.workOrder.quantityInt') })
  @Min(1, {
    message: i18nValidationMessage('validation.workOrder.quantityMin'),
  })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Precio unitario (default: 0)',
    example: 350.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber(
    {},
    { message: i18nValidationMessage('validation.workOrder.unitPriceNumber') },
  )
  @Min(0, {
    message: i18nValidationMessage('validation.workOrder.unitPriceMin'),
  })
  @IsOptional()
  unitPrice?: number;
}
