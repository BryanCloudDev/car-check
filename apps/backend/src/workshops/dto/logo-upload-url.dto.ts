import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALLOWED_LOGO_TYPES, MAX_LOGO_BYTES } from '../workshops.constants';

export class LogoUploadUrlDto {
  @ApiProperty({
    description:
      'MIME type del logo. Sólo PNG o JPEG (van embebidos en el PDF).',
    enum: ALLOWED_LOGO_TYPES,
    example: 'image/png',
  })
  @IsIn(ALLOWED_LOGO_TYPES, {
    message: i18nValidationMessage('validation.workshop.logoTypeNotAllowed'),
  })
  contentType: string;

  @ApiPropertyOptional({
    description: 'Tamaño del logo en bytes (máx. 2 MB)',
    example: 40960,
  })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.workshop.logoSizeInt') })
  @Min(1, { message: i18nValidationMessage('validation.workshop.logoSizeMin') })
  @Max(MAX_LOGO_BYTES, {
    message: i18nValidationMessage('validation.workshop.logoSizeMax'),
  })
  sizeBytes?: number;
}
