import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALLOWED_CONTENT_TYPES, MAX_BYTES } from '../media.constants';

export class ConfirmUploadDto {
  @ApiProperty({
    description:
      'Clave (path) del objeto en S3, obtenida al solicitar la URL pre-firmada',
    example: 'work-orders/abc123/media/foto.jpg',
  })
  @IsString({ message: 'La clave del archivo debe ser texto' })
  @IsNotEmpty({ message: 'La clave del archivo es obligatoria' })
  key: string;

  @ApiProperty({
    description: 'MIME type del archivo subido',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: 'El tipo de archivo no está permitido',
  })
  contentType: string;

  @ApiPropertyOptional({
    description: 'Tamaño del archivo en bytes',
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
