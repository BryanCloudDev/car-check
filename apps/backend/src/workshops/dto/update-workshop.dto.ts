import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WORKSHOP_FIELD_LIMITS } from '../workshops.constants';

/**
 * Todos los campos son opcionales: es un PATCH parcial. Enviar `null` en un
 * campo nullable lo limpia (`@IsOptional` deja pasar null).
 */
export class UpdateWorkshopDto {
  @ApiPropertyOptional({
    description: 'Nombre comercial del taller',
    example: 'Taller Mecánico El Salvador',
  })
  @IsString({ message: i18nValidationMessage('validation.workshop.nameText') })
  @MinLength(WORKSHOP_FIELD_LIMITS.NAME_MIN, {
    message: i18nValidationMessage('validation.workshop.nameMinLength'),
  })
  @MaxLength(WORKSHOP_FIELD_LIMITS.NAME_MAX, {
    message: i18nValidationMessage('validation.workshop.nameMaxLength'),
  })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Correo de contacto del taller',
    example: 'contacto@taller.sv',
  })
  @IsEmail(
    {},
    { message: i18nValidationMessage('validation.workshop.emailInvalid') },
  )
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto. Enviar null para limpiarlo.',
    example: '+503 2222 3333',
    nullable: true,
  })
  @IsString({ message: i18nValidationMessage('validation.workshop.phoneText') })
  @MinLength(WORKSHOP_FIELD_LIMITS.PHONE_MIN, {
    message: i18nValidationMessage('validation.workshop.phoneMinLength'),
  })
  @MaxLength(WORKSHOP_FIELD_LIMITS.PHONE_MAX, {
    message: i18nValidationMessage('validation.workshop.phoneMaxLength'),
  })
  @IsOptional()
  phone?: string | null;

  @ApiPropertyOptional({
    description:
      'Dirección que aparece en los documentos. Enviar null para limpiarla.',
    example: 'Calle Rubén Darío #123, San Salvador',
    nullable: true,
  })
  @IsString({
    message: i18nValidationMessage('validation.workshop.addressText'),
  })
  @MaxLength(WORKSHOP_FIELD_LIMITS.ADDRESS_MAX, {
    message: i18nValidationMessage('validation.workshop.addressMaxLength'),
  })
  @IsOptional()
  address?: string | null;

  @ApiPropertyOptional({
    description:
      'NIT del taller. Persona jurídica usa el NIT de 14 dígitos; persona ' +
      'natural usa su DUI. No se valida el formato por país. Enviar null para limpiarlo.',
    example: '0614-010203-102-1',
    nullable: true,
  })
  @IsString({ message: i18nValidationMessage('validation.workshop.nitText') })
  @MaxLength(WORKSHOP_FIELD_LIMITS.NIT_MAX, {
    message: i18nValidationMessage('validation.workshop.nitMaxLength'),
  })
  @IsOptional()
  nit?: string | null;
}
