import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@taller.com',
  })
  @IsEmail({}, { message: 'El email debe ser un email válido' })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'secret123' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password: string;
}
