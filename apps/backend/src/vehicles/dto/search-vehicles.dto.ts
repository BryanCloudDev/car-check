import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchVehiclesDto {
  @ApiPropertyOptional({
    description:
      'Término de búsqueda: VIN exacto (principal) o placa (secundaria). ' +
      'Si se omite, devuelve todos los vehículos.',
    example: '1HGCM82633A004352',
  })
  @IsString({ message: i18nValidationMessage('validation.vehicle.searchText') })
  @IsOptional()
  q?: string;
}
