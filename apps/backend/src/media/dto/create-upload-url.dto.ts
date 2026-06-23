import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALLOWED_CONTENT_TYPES, MAX_BYTES } from '../media.constants';

export class CreateUploadUrlDto {
  @ApiProperty({
    description: 'MIME type del archivo a subir',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: string;

  @ApiPropertyOptional({
    description:
      'Tamaño del archivo en bytes (máx. 200 MB para video, 20 MB para imagen)',
    example: 204800,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_BYTES.VIDEO)
  sizeBytes?: number;
}
