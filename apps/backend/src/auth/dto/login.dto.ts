import { IsEmail, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@taller.com',
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage('validation.auth.emailInvalid') },
  )
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'secret123' })
  @IsString({ message: i18nValidationMessage('validation.auth.passwordText') })
  @MinLength(1, {
    message: i18nValidationMessage('validation.auth.passwordRequired'),
  })
  password: string;
}
