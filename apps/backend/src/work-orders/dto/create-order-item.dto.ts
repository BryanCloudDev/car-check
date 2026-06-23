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
  @IsEnum(OrderItemType)
  type: OrderItemType;

  @ApiProperty({
    description: 'Descripción del servicio o repuesto',
    example: 'Cambio de aceite 5W-30',
  })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiPropertyOptional({
    description: 'Cantidad (default: 1)',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Precio unitario (default: 0)',
    example: 350.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;
}
