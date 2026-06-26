import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Marca del vehículo', example: 'Honda' })
  @IsString({ message: 'La marca debe ser texto' })
  @IsOptional()
  make?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo', example: 'Civic' })
  @IsString({ message: 'El modelo debe ser texto' })
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo', example: 2020 })
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(1885, { message: 'El año debe ser 1885 o posterior' })
  @Max(new Date().getFullYear() + 1, {
    message: 'El año no puede ser mayor a $constraint1',
  })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Kilometraje actual', example: 45000 })
  @IsInt({ message: 'El kilometraje debe ser un número entero' })
  @Min(0, { message: 'El kilometraje no puede ser negativo' })
  @IsOptional()
  mileage?: number;
}
