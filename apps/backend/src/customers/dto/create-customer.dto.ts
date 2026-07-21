import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
  })
  @IsString({ message: i18nValidationMessage('validation.customer.nameText') })
  @MinLength(2, {
    message: i18nValidationMessage('validation.customer.nameMinLength'),
  })
  name: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+52 55 9876 5432',
  })
  @IsString({ message: i18nValidationMessage('validation.customer.phoneText') })
  @MinLength(7, {
    message: i18nValidationMessage('validation.customer.phoneMinLength'),
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan@example.com',
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage('validation.customer.emailInvalid') },
  )
  @IsOptional()
  email?: string;
}
