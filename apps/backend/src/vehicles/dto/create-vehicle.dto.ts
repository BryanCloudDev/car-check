import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { VIN_REGEX } from '../../common/constants';

export class CreateVehicleDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(VIN_REGEX, {
    message: 'El VIN debe tener 17 caracteres alfanuméricos (sin I, O, Q)',
  })
  vin: string;

  @IsString()
  @IsOptional()
  plate?: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @Min(1885)
  @Max(new Date().getFullYear() + 1)
  @IsOptional()
  year?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;
}
