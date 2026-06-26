import { Type, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VIN_REGEX } from '../../common/constants';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateWorkOrderDto {
  @ApiProperty({
    description: 'VIN del vehículo (ISO 3779). 17 caracteres, sin I, O ni Q.',
    example: '1HGCM82633A004352',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(VIN_REGEX, {
    message: 'El VIN debe tener 17 caracteres alfanuméricos (sin I, O, Q)',
  })
  vin: string;

  @ApiPropertyOptional({
    description: 'Placa del vehículo',
    example: 'ABC-123',
  })
  @IsString({ message: 'La placa debe ser texto' })
  @IsOptional()
  plate?: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo', example: 'Toyota' })
  @IsString({ message: 'La marca debe ser texto' })
  @IsOptional()
  make?: string;

  @ApiPropertyOptional({
    description: 'Modelo del vehículo',
    example: 'Corolla',
  })
  @IsString({ message: 'El modelo debe ser texto' })
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo', example: 2019 })
  @Type(() => Number)
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(1885, { message: 'El año debe ser 1885 o posterior' })
  @Max(new Date().getFullYear() + 1, {
    message: 'El año no puede ser mayor a $constraint1',
  })
  @IsOptional()
  year?: number;

  @ApiProperty({
    description: 'ID del cliente (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString({ message: 'Seleccioná un cliente' })
  customerId: string;

  @ApiPropertyOptional({
    description: 'Kilometraje al recibir el vehículo',
    example: 62000,
  })
  @Type(() => Number)
  @IsInt({ message: 'El kilometraje debe ser un número entero' })
  @Min(0, { message: 'El kilometraje no puede ser negativo' })
  @IsOptional()
  mileage?: number;

  @ApiPropertyOptional({
    description: 'Notas u observaciones de la orden',
    example: 'Cliente menciona ruido al frenar.',
  })
  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Fecha de servicio (ISO 8601)',
    example: '2026-06-23',
  })
  @IsDateString(
    {},
    { message: 'La fecha de servicio debe tener un formato válido' },
  )
  @IsOptional()
  serviceDate?: string;

  @ApiProperty({
    description: 'Ítems de la orden (servicios y/o repuestos). Mínimo 1.',
    type: [CreateOrderItemDto],
  })
  @IsArray({ message: 'Los ítems deben ser una lista' })
  @ArrayMinSize(1, { message: 'Agregá al menos un ítem a la orden' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
