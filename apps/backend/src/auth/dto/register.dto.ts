import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre del taller',
    example: 'Taller Mecánico García',
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.workshopNameText'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.workshopNameRequired'),
  })
  workshopName: string;

  @ApiProperty({
    description: 'Email de contacto del taller',
    example: 'contacto@taller.com',
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage('validation.auth.workshopEmailInvalid') },
  )
  workshopEmail: string;

  @ApiPropertyOptional({
    description: 'Teléfono del taller',
    example: '+52 55 1234 5678',
  })
  @IsString({ message: i18nValidationMessage('validation.auth.phoneText') })
  @IsOptional()
  workshopPhone?: string;

  @ApiProperty({
    description: 'Nombre del administrador',
    example: 'Carlos García',
  })
  @IsString({ message: i18nValidationMessage('validation.auth.adminNameText') })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.auth.adminNameRequired'),
  })
  adminName: string;

  @ApiProperty({
    description: 'Email del administrador',
    example: 'admin@taller.com',
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage('validation.auth.adminEmailInvalid') },
  )
  adminEmail: string;

  @ApiProperty({
    description: 'Contraseña del administrador (mínimo 8 caracteres)',
    example: 'Segura123!',
  })
  @IsString({
    message: i18nValidationMessage('validation.auth.adminPasswordText'),
  })
  @MinLength(8, {
    message: i18nValidationMessage('validation.auth.adminPasswordMinLength'),
  })
  adminPassword: string;
}
