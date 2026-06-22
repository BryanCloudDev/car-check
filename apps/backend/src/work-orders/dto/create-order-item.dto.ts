import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsEnum(['SERVICIO', 'REPUESTO'])
  type: 'SERVICIO' | 'REPUESTO';

  @IsString()
  @MinLength(1)
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;
}
