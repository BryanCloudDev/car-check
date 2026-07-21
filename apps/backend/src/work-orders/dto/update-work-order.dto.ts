import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto';

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({
    description: 'Kilometraje actualizado',
    example: 63000,
  })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.vehicle.mileageInt') })
  @Min(0, { message: i18nValidationMessage('validation.vehicle.mileageMin') })
  @IsOptional()
  mileage?: number;

  @ApiPropertyOptional({
    description: 'Notas u observaciones',
    example: 'Se detectó fuga de aceite adicional.',
  })
  @IsString({
    message: i18nValidationMessage('validation.workOrder.notesText'),
  })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Fecha de servicio (ISO 8601)',
    example: '2026-06-24',
  })
  @IsDateString(
    {},
    {
      message: i18nValidationMessage('validation.workOrder.serviceDateInvalid'),
    },
  )
  @IsOptional()
  serviceDate?: string;

  @ApiPropertyOptional({
    description: 'Reemplazo completo de los ítems de la orden.',
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
  @IsOptional()
  items?: CreateOrderItemDto[];
}
