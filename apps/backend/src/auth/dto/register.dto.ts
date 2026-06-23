import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre del taller',
    example: 'Taller Mecánico García',
  })
  @IsString({ message: 'El nombre del taller debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del taller es obligatorio' })
  workshopName: string;

  @ApiProperty({
    description: 'Email de contacto del taller',
    example: 'contacto@taller.com',
  })
  @IsEmail({}, { message: 'El email del taller debe ser un email válido' })
  workshopEmail: string;

  @ApiPropertyOptional({
    description: 'Teléfono del taller',
    example: '+52 55 1234 5678',
  })
  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  workshopPhone?: string;

  @ApiProperty({
    description: 'Nombre del administrador',
    example: 'Carlos García',
  })
  @IsString({ message: 'El nombre del administrador debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del administrador es obligatorio' })
  adminName: string;

  @ApiProperty({
    description: 'Email del administrador',
    example: 'admin@taller.com',
  })
  @IsEmail(
    {},
    { message: 'El email del administrador debe ser un email válido' },
  )
  adminEmail: string;

  @ApiProperty({
    description: 'Contraseña del administrador (mínimo 8 caracteres)',
    example: 'Segura123!',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  adminPassword: string;
}
