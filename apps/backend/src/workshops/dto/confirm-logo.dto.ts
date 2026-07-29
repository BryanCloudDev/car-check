import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmLogoDto {
  @ApiProperty({
    description:
      'Key del objeto en S3 devuelta por el endpoint de URL de carga. Debe ' +
      'pertenecer al prefijo del taller autenticado.',
    example: 'workshops/ckxy.../logo/uuid',
  })
  @IsString({ message: i18nValidationMessage('validation.workshop.keyText') })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.workshop.keyRequired'),
  })
  key: string;
}
