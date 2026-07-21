import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALLOWED_CONTENT_TYPES, MAX_BYTES } from '../media.constants';

export class ConfirmUploadDto {
  @ApiProperty({
    description:
      'Clave (path) del objeto en S3, obtenida al solicitar la URL pre-firmada',
    example: 'work-orders/abc123/media/foto.jpg',
  })
  @IsString({ message: i18nValidationMessage('validation.media.keyText') })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.media.keyRequired'),
  })
  key: string;

  @ApiProperty({
    description: 'MIME type del archivo subido',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: i18nValidationMessage('validation.media.contentTypeNotAllowed'),
  })
  contentType: string;

  @ApiPropertyOptional({
    description: 'Tamaño del archivo en bytes',
    example: 204800,
  })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.media.sizeInt') })
  @Min(1, { message: i18nValidationMessage('validation.media.sizeMin') })
  @Max(MAX_BYTES.VIDEO, {
    message: i18nValidationMessage('validation.media.sizeMax'),
  })
  sizeBytes?: number;
}
