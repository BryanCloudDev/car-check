import { ApiProperty } from '@nestjs/swagger';

/**
 * Perfil público del taller. No expone `logoKey`: el cliente sólo recibe
 * `logoUrl` ya firmada.
 */
export class WorkshopResponse {
  @ApiProperty({ description: 'ID del taller', example: 'ckxy...' })
  id: string;

  @ApiProperty({
    description: 'Nombre comercial',
    example: 'Taller Mecánico El Salvador',
  })
  name: string;

  @ApiProperty({
    description: 'Correo de contacto',
    example: 'contacto@taller.sv',
  })
  email: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+503 2222 3333',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Dirección que aparece en los documentos',
    example: 'Calle Rubén Darío #123, San Salvador',
    nullable: true,
  })
  address: string | null;

  @ApiProperty({
    description: 'NIT del taller (o DUI si es persona natural)',
    example: '0614-010203-102-1',
    nullable: true,
  })
  nit: string | null;

  @ApiProperty({
    description:
      'URL pre-firmada del logo (expira en 5 min). null si el taller no tiene logo.',
    example:
      'https://bucket.s3.amazonaws.com/workshops/ckxy/logo/uuid?X-Amz-...',
    nullable: true,
  })
  logoUrl: string | null;

  @ApiProperty({
    description: 'Fecha de creación (ISO 8601)',
    example: '2026-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización (ISO 8601)',
    example: '2026-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
