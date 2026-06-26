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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItemType } from '../../../generated/prisma/client';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Tipo de ítem',
    enum: OrderItemType,
    example: OrderItemType.SERVICIO,
  })
  @IsEnum(OrderItemType, {
    message: 'El tipo de ítem debe ser SERVICIO o REPUESTO',
  })
  type: OrderItemType;

  @ApiProperty({
    description: 'Descripción del servicio o repuesto',
    example: 'Cambio de aceite 5W-30',
  })
  @IsString({ message: 'La descripción debe ser texto' })
  @MinLength(1, { message: 'Cada ítem necesita una descripción' })
  description: string;

  @ApiPropertyOptional({
    description: 'Cantidad (default: 1)',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser 1 o más' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Precio unitario (default: 0)',
    example: 350.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  @IsOptional()
  unitPrice?: number;
}
