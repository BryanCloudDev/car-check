import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VIN_REGEX } from '../../common/constants';

export class CreateVehicleDto {
  @ApiProperty({
    description:
      'Número de identificación del vehículo (ISO 3779). 17 caracteres, sin I, O ni Q.',
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

  @ApiPropertyOptional({ description: 'Marca del vehículo', example: 'Honda' })
  @IsString({ message: i18nValidationMessage('validation.vehicle.makeText') })
  @IsOptional()
  make?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo', example: 'Civic' })
  @IsString({ message: i18nValidationMessage('validation.vehicle.modelText') })
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo', example: 2020 })
  @IsInt({ message: i18nValidationMessage('validation.vehicle.yearInt') })
  @Min(1885, { message: i18nValidationMessage('validation.vehicle.yearMin') })
  @Max(new Date().getFullYear() + 1, {
    message: i18nValidationMessage('validation.vehicle.yearMax'),
  })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Kilometraje actual', example: 45000 })
  @IsInt({ message: i18nValidationMessage('validation.vehicle.mileageInt') })
  @Min(0, { message: i18nValidationMessage('validation.vehicle.mileageMin') })
  @IsOptional()
  mileage?: number;
}
