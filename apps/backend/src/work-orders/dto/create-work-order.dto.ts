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
import { i18nValidationMessage } from 'nestjs-i18n';
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
    message: i18nValidationMessage('validation.vehicle.vin'),
  })
  vin: string;

  @ApiPropertyOptional({
    description: 'Placa del vehículo',
    example: 'ABC-123',
  })
  @IsString({ message: i18nValidationMessage('validation.vehicle.plateText') })
  @IsOptional()
  plate?: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo', example: 'Toyota' })
  @IsString({ message: i18nValidationMessage('validation.vehicle.makeText') })
  @IsOptional()
  make?: string;

  @ApiPropertyOptional({
    description: 'Modelo del vehículo',
    example: 'Corolla',
  })
  @IsString({ message: i18nValidationMessage('validation.vehicle.modelText') })
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo', example: 2019 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.vehicle.yearInt') })
  @Min(1885, { message: i18nValidationMessage('validation.vehicle.yearMin') })
  @Max(new Date().getFullYear() + 1, {
    message: i18nValidationMessage('validation.vehicle.yearMax'),
  })
  @IsOptional()
  year?: number;

  @ApiProperty({
    description: 'ID del cliente (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString({
    message: i18nValidationMessage('validation.workOrder.customerRequired'),
  })
  customerId: string;

  @ApiPropertyOptional({
    description: 'Kilometraje al recibir el vehículo',
    example: 62000,
  })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.vehicle.mileageInt') })
  @Min(0, { message: i18nValidationMessage('validation.vehicle.mileageMin') })
  @IsOptional()
  mileage?: number;

  @ApiPropertyOptional({
    description: 'Notas u observaciones de la orden',
    example: 'Cliente menciona ruido al frenar.',
  })
  @IsString({
    message: i18nValidationMessage('validation.workOrder.notesText'),
  })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Fecha de servicio (ISO 8601)',
    example: '2026-06-23',
  })
  @IsDateString(
    {},
    {
      message: i18nValidationMessage('validation.workOrder.serviceDateInvalid'),
    },
  )
  @IsOptional()
  serviceDate?: string;

  @ApiProperty({
    description: 'Ítems de la orden (servicios y/o repuestos). Mínimo 1.',
    type: [CreateOrderItemDto],
  })
  @IsArray({
    message: i18nValidationMessage('validation.workOrder.itemsArray'),
  })
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.workOrder.itemsMinSize'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
