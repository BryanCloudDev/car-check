import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiBearerAuth('access-token')
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token JWT inválido o ausente.',
})
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar vehículo',
    description:
      'Crea un nuevo vehículo identificado por VIN. El VIN es único globalmente entre todos los talleres.',
  })
  @ApiResponse({ status: 201, description: 'Vehículo creado.' })
  @ApiResponse({
    status: 400,
    description: 'VIN inválido o datos incorrectos.',
  })
  @ApiResponse({ status: 409, description: 'El VIN ya está registrado.' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get(':vin')
  @ApiOperation({ summary: 'Obtener vehículo por VIN' })
  @ApiParam({
    name: 'vin',
    description: 'VIN del vehículo (17 caracteres)',
    example: '1HGCM82633A004352',
  })
  @ApiResponse({ status: 200, description: 'Datos del vehículo.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  findOne(@Param('vin') vin: string) {
    return this.vehiclesService.findOne(vin);
  }

  @Patch(':vin')
  @ApiOperation({ summary: 'Actualizar vehículo' })
  @ApiParam({
    name: 'vin',
    description: 'VIN del vehículo (17 caracteres)',
    example: '1HGCM82633A004352',
  })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  update(@Param('vin') vin: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(vin, dto);
  }

  @Get(':vin/history')
  @ApiOperation({
    summary: 'Historial de órdenes del vehículo',
    description:
      'Devuelve las órdenes de trabajo del vehículo pertenecientes al taller autenticado.',
  })
  @ApiParam({
    name: 'vin',
    description: 'VIN del vehículo (17 caracteres)',
    example: '1HGCM82633A004352',
  })
  @ApiResponse({ status: 200, description: 'Lista de órdenes de trabajo.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  getHistory(@CurrentWorkshop() workshopId: string, @Param('vin') vin: string) {
    return this.vehiclesService.getHistory(workshopId, vin);
  }
}
