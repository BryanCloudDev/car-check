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
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'MIME type del archivo subido',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: string;

  @ApiPropertyOptional({
    description: 'Tamaño del archivo en bytes',
    example: 204800,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_BYTES.VIDEO)
  sizeBytes?: number;
}
