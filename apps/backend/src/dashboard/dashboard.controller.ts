import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardResponse } from './dto/dashboard.response';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token JWT inválido o ausente.',
})
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Métricas del dashboard',
    description:
      'Agregados del taller autenticado: órdenes activas por estado, ' +
      'ingresos del día y del mes, y órdenes listas para entregar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas del dashboard.',
    type: DashboardResponse,
  })
  getMetrics(@CurrentWorkshop() workshopId: string) {
    return this.dashboardService.getMetrics(workshopId);
  }
}
