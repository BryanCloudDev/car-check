import {
  Body,
  Controller,
  Delete,
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
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth('access-token')
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token JWT inválido o ausente.',
})
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar clientes',
    description:
      'Devuelve todos los clientes del taller autenticado, ordenados por nombre.',
  })
  @ApiResponse({ status: 200, description: 'Lista de clientes.' })
  findAll(@CurrentWorkshop() workshopId: string) {
    return this.customersService.findAll(workshopId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)' })
  @ApiResponse({ status: 200, description: 'Datos del cliente.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  findOne(@CurrentWorkshop() workshopId: string, @Param('id') id: string) {
    return this.customersService.findOne(workshopId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(
    @CurrentWorkshop() workshopId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(workshopId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  update(
    @CurrentWorkshop() workshopId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(workshopId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)' })
  @ApiResponse({ status: 204, description: 'Cliente eliminado.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  remove(@CurrentWorkshop() workshopId: string, @Param('id') id: string) {
    return this.customersService.remove(workshopId, id);
  }
}
