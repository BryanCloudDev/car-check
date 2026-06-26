import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderStatus } from '../../generated/prisma/client';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkOrdersService } from './work-orders.service';
import { AdvanceStatusDto } from './dto/advance-status.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { SearchWorkOrdersDto } from './dto/search-work-orders.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';

@ApiTags('work-orders')
@ApiBearerAuth('access-token')
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token JWT inválido o ausente.',
})
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear orden de trabajo',
    description:
      'Crea una nueva orden con sus ítems (servicios y/o repuestos). Si el VIN no existe, crea el vehículo automáticamente.',
  })
  @ApiResponse({ status: 201, description: 'Orden creada.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Cliente no pertenece al taller.' })
  create(
    @CurrentWorkshop() workshopId: string,
    @Body() dto: CreateWorkOrderDto,
  ) {
    return this.workOrdersService.create(workshopId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar órdenes de trabajo',
    description:
      'Devuelve las órdenes del taller autenticado (con ítems, vehículo y ' +
      'cliente), ordenadas de la más reciente a la más antigua. Filtro ' +
      'opcional por estado con `status`.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Filtrar por estado de la orden.',
  })
  @ApiResponse({ status: 200, description: 'Lista de órdenes de trabajo.' })
  findAll(
    @CurrentWorkshop() workshopId: string,
    @Query() dto: SearchWorkOrdersDto,
  ) {
    return this.workOrdersService.findAll(workshopId, dto.status);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener orden de trabajo por ID',
    description: 'Devuelve la orden con sus ítems, vehículo y cliente.',
  })
  @ApiParam({ name: 'id', description: 'ID de la orden de trabajo (UUID)' })
  @ApiResponse({ status: 200, description: 'Datos de la orden.' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada.' })
  findOne(@CurrentWorkshop() workshopId: string, @Param('id') id: string) {
    return this.workOrdersService.findOne(workshopId, id);
  }

  @Get(':id/receipt.pdf')
  @ApiOperation({
    summary: 'Descargar comprobante PDF',
    description: 'Genera y descarga el comprobante PDF de la orden de trabajo.',
  })
  @ApiParam({ name: 'id', description: 'ID de la orden de trabajo (UUID)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo PDF del comprobante.' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada.' })
  async getReceipt(
    @CurrentWorkshop() workshopId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.workOrdersService.getReceipt(workshopId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${id}.pdf"`,
    });
    return new StreamableFile(buffer);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Avanzar estado de la orden',
    description:
      'Transiciones válidas: RECIBIDO→EN_PROCESO, EN_PROCESO→LISTO|RECIBIDO, LISTO→ENTREGADO.',
  })
  @ApiParam({ name: 'id', description: 'ID de la orden de trabajo (UUID)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado.' })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado no permitida.',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada.' })
  advanceStatus(
    @CurrentWorkshop() workshopId: string,
    @Param('id') id: string,
    @Body() dto: AdvanceStatusDto,
  ) {
    return this.workOrdersService.advanceStatus(workshopId, id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar orden de trabajo' })
  @ApiParam({ name: 'id', description: 'ID de la orden de trabajo (UUID)' })
  @ApiResponse({ status: 200, description: 'Orden actualizada.' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada.' })
  update(
    @CurrentWorkshop() workshopId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(workshopId, id, dto);
  }
}
