import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@ApiTags('media')
@ApiBearerAuth('access-token')
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token JWT inválido o ausente.',
})
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post(':orderId/media/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener URL de carga',
    description:
      'Genera una URL pre-firmada de S3 para subir un archivo directamente. La URL expira en 5 minutos.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'ID de la orden de trabajo (UUID)',
  })
  @ApiResponse({
    status: 200,
    description: 'URL pre-firmada de S3 y key del objeto.',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada.' })
  createUploadUrl(
    @CurrentWorkshop() workshopId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateUploadUrlDto,
  ) {
    return this.mediaService.createUploadUrl(workshopId, orderId, dto);
  }

  @Post(':orderId/media/confirm')
  @ApiOperation({
    summary: 'Confirmar carga de archivo',
    description:
      'Registra en la base de datos el archivo ya subido a S3. Llamar después de un PUT exitoso a la URL pre-firmada.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'ID de la orden de trabajo (UUID)',
  })
  @ApiResponse({ status: 201, description: 'MediaAsset registrado.' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada.' })
  confirmUpload(
    @CurrentWorkshop() workshopId: string,
    @Param('orderId') orderId: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.mediaService.confirmUpload(workshopId, orderId, dto);
  }
}
