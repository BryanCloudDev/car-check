import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALLOWED_CONTENT_TYPES, MAX_BYTES } from '../media.constants';

export class CreateUploadUrlDto {
  @ApiProperty({
    description: 'MIME type del archivo a subir',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: i18nValidationMessage('validation.media.contentTypeNotAllowed'),
  })
  contentType: string;

  @ApiPropertyOptional({
    description:
      'Tamaño del archivo en bytes (máx. 200 MB para video, 20 MB para imagen)',
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
