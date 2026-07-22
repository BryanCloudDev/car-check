import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/client';

export class CurrentUserResponse {
  @ApiProperty({ description: 'ID del usuario', example: 'clx1234567890' })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@taller.com',
  })
  email: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan Pérez' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role: UserRole;

  @ApiProperty({ description: 'ID del taller', example: 'clx0987654321' })
  workshopId: string;
}
