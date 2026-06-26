import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+52 55 9876 5432',
  })
  @IsString({ message: 'El teléfono debe ser texto' })
  @MinLength(7, { message: 'El teléfono debe tener al menos 7 caracteres' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan@example.com',
  })
  @IsEmail({}, { message: 'Ingresá un correo electrónico válido' })
  @IsOptional()
  email?: string;
}
