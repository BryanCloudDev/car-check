import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVehicleDto {
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

  @ApiPropertyOptional({ description: 'Año del vehículo', example: 2021 })
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(1885, { message: 'El año debe ser 1885 o posterior' })
  @Max(new Date().getFullYear() + 1, {
    message: 'El año no puede ser mayor a $constraint1',
  })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Kilometraje actual', example: 50000 })
  @IsInt({ message: 'El kilometraje debe ser un número entero' })
  @Min(0, { message: 'El kilometraje no puede ser negativo' })
  @IsOptional()
  mileage?: number;
}
