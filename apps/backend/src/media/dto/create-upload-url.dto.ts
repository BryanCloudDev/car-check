import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALLOWED_CONTENT_TYPES, MAX_BYTES } from '../media.constants';

export class CreateUploadUrlDto {
  @ApiProperty({
    description: 'MIME type del archivo a subir',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: 'El tipo de archivo no está permitido',
  })
  contentType: string;

  @ApiPropertyOptional({
    description:
      'Tamaño del archivo en bytes (máx. 200 MB para video, 20 MB para imagen)',
    example: 204800,
  })
  @IsOptional()
  @IsInt({ message: 'El tamaño del archivo debe ser un número entero' })
  @Min(1, { message: 'El tamaño del archivo debe ser mayor a 0' })
  @Max(MAX_BYTES.VIDEO, {
    message: 'El archivo supera el tamaño máximo permitido',
  })
  sizeBytes?: number;
}
