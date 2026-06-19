import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email debe ser un email válido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password: string;
}
