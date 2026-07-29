import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { WorkshopsService } from './workshops.service';
import { ConfirmLogoDto } from './dto/confirm-logo.dto';
import { LogoUploadUrlDto } from './dto/logo-upload-url.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopResponse } from './dto/workshop.response';

const FORBIDDEN_DESCRIPTION = 'Rol insuficiente (requiere ADMIN).';

@ApiTags('workshops')
@ApiBearerAuth('access-token')
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token JWT inválido o ausente.',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Obtener datos del taller',
    description:
      'Devuelve el perfil del taller autenticado. Disponible para cualquier ' +
      'usuario con sesión, porque el nombre y el logo se muestran en la UI.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del taller.',
    type: WorkshopResponse,
  })
  @ApiResponse({ status: 404, description: 'Taller no encontrado.' })
  findOne(@CurrentWorkshop() workshopId: string) {
    return this.workshopsService.findOne(workshopId);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar datos del taller',
    description:
      'Actualiza nombre, correo, teléfono, dirección y NIT. Solo ADMIN. ' +
      'Los campos nullables se limpian enviando null o cadena vacía.',
  })
  @ApiResponse({
    status: 200,
    description: 'Taller actualizado.',
    type: WorkshopResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 403, description: FORBIDDEN_DESCRIPTION })
  @ApiResponse({ status: 404, description: 'Taller no encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'El correo ya está en uso por otro taller.',
  })
  update(
    @CurrentWorkshop() workshopId: string,
    @Body() dto: UpdateWorkshopDto,
  ) {
    return this.workshopsService.update(workshopId, dto);
  }

  @Post('me/logo/upload-url')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener URL de carga del logo',
    description:
      'Genera una URL pre-firmada de S3 para subir el logo directamente. ' +
      'Expira en 5 minutos. Solo ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'URL pre-firmada de S3 y key del objeto.',
  })
  @ApiResponse({ status: 400, description: 'Tipo o tamaño no permitido.' })
  @ApiResponse({ status: 403, description: FORBIDDEN_DESCRIPTION })
  createLogoUploadUrl(
    @CurrentWorkshop() workshopId: string,
    @Body() dto: LogoUploadUrlDto,
  ) {
    return this.workshopsService.createLogoUploadUrl(workshopId, dto);
  }

  @Post('me/logo/confirm')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar carga del logo',
    description:
      'Asocia al taller el logo ya subido a S3. Llamar después de un PUT ' +
      'exitoso a la URL pre-firmada. Borra el logo anterior. Solo ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Taller con el logo actualizado.',
    type: WorkshopResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'La key no pertenece a este taller.',
  })
  @ApiResponse({ status: 403, description: FORBIDDEN_DESCRIPTION })
  confirmLogo(
    @CurrentWorkshop() workshopId: string,
    @Body() dto: ConfirmLogoDto,
  ) {
    return this.workshopsService.confirmLogo(workshopId, dto);
  }

  @Delete('me/logo')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Quitar el logo del taller',
    description: 'Borra el logo de S3 y lo desasocia del taller. Solo ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Taller sin logo.',
    type: WorkshopResponse,
  })
  @ApiResponse({ status: 403, description: FORBIDDEN_DESCRIPTION })
  @ApiResponse({ status: 404, description: 'Taller no encontrado.' })
  removeLogo(@CurrentWorkshop() workshopId: string) {
    return this.workshopsService.removeLogo(workshopId);
  }
}
