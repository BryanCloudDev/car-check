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
  @IsString()
  @IsOptional()
  plate?: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo', example: 'Honda' })
  @IsString()
  @IsOptional()
  make?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo', example: 'Civic' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo', example: 2020 })
  @IsInt()
  @Min(1885)
  @Max(new Date().getFullYear() + 1)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Kilometraje actual', example: 45000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;
}
