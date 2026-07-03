import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../../../generated/prisma/client';

export class MediaAssetResponse {
  @ApiProperty({ description: 'UUID del asset', example: 'uuid-...' })
  id: string;

  @ApiProperty({
    description: 'Clave S3 del objeto',
    example: 'orders/uuid/uuid',
  })
  key: string;

  @ApiProperty({
    description: 'MIME type del archivo',
    example: 'image/jpeg',
    nullable: true,
  })
  contentType: string | null;

  @ApiProperty({
    enum: MediaType,
    description: 'Tipo de media',
    example: MediaType.IMAGEN,
  })
  type: MediaType;

  @ApiProperty({
    description: 'Tamaño en bytes',
    example: 204800,
    nullable: true,
  })
  sizeBytes: number | null;

  @ApiProperty({
    description: 'Fecha de creación (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'URL pre-firmada de S3 para leer el objeto (expira en 5 min)',
    example: 'https://bucket.s3.amazonaws.com/orders/uuid/uuid?X-Amz-...',
  })
  url: string;
}
