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
  @IsInt({ message: 'El kilometraje debe ser un número entero' })
  @Min(0, { message: 'El kilometraje no puede ser negativo' })
  @IsOptional()
  mileage?: number;

  @ApiPropertyOptional({
    description: 'Notas u observaciones',
    example: 'Se detectó fuga de aceite adicional.',
  })
  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Fecha de servicio (ISO 8601)',
    example: '2026-06-24',
  })
  @IsDateString(
    {},
    { message: 'La fecha de servicio debe tener un formato válido' },
  )
  @IsOptional()
  serviceDate?: string;

  @ApiPropertyOptional({
    description: 'Reemplazo completo de los ítems de la orden.',
    type: [CreateOrderItemDto],
  })
  @IsArray({ message: 'Los ítems deben ser una lista' })
  @ArrayMinSize(1, { message: 'Agregá al menos un ítem a la orden' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsOptional()
  items?: CreateOrderItemDto[];
}
