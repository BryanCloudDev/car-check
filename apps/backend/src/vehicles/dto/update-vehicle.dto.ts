import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVehicleDto {
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

  @ApiPropertyOptional({ description: 'Año del vehículo', example: 2021 })
  @IsInt({ message: i18nValidationMessage('validation.vehicle.yearInt') })
  @Min(1885, { message: i18nValidationMessage('validation.vehicle.yearMin') })
  @Max(new Date().getFullYear() + 1, {
    message: i18nValidationMessage('validation.vehicle.yearMax'),
  })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Kilometraje actual', example: 50000 })
  @IsInt({ message: i18nValidationMessage('validation.vehicle.mileageInt') })
  @Min(0, { message: i18nValidationMessage('validation.vehicle.mileageMin') })
  @IsOptional()
  mileage?: number;
}
