import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto';

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({
    description: 'Kilometraje actualizado',
    example: 63000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;

  @ApiPropertyOptional({
    description: 'Notas u observaciones',
    example: 'Se detectó fuga de aceite adicional.',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Fecha de servicio (ISO 8601)',
    example: '2026-06-24',
  })
  @IsDateString()
  @IsOptional()
  serviceDate?: string;

  @ApiPropertyOptional({
    description: 'Reemplazo completo de los ítems de la orden.',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsOptional()
  items?: CreateOrderItemDto[];
}
