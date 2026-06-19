import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'El nombre del taller debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del taller es obligatorio' })
  workshopName: string;

  @IsEmail({}, { message: 'El email del taller debe ser un email válido' })
  workshopEmail: string;

  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  workshopPhone?: string;

  @IsString({ message: 'El nombre del administrador debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del administrador es obligatorio' })
  adminName: string;

  @IsEmail(
    {},
    { message: 'El email del administrador debe ser un email válido' },
  )
  adminEmail: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  adminPassword: string;
}
