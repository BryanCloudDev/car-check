import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateVehicleDto {
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
