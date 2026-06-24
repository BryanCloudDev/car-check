import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchVehiclesDto {
  @ApiPropertyOptional({
    description:
      'Término de búsqueda: VIN exacto (principal) o placa (secundaria). ' +
      'Si se omite, devuelve todos los vehículos.',
    example: '1HGCM82633A004352',
  })
  @IsString()
  @IsOptional()
  q?: string;
}
