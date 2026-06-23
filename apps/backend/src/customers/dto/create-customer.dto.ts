import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+52 55 9876 5432',
  })
  @IsString()
  @MinLength(7)
  phone: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico',
    example: 'juan@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
