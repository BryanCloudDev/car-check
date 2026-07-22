import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardResponse } from './dto/dashboard.response';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@ApiResponse({
  status: 401,
  description: 'No autorizado. Token JWT inválido o ausente.',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Métricas del dashboard',
    description:
      'Agregados del taller autenticado: órdenes activas por estado, ' +
      'ingresos del día y del mes, y órdenes listas para entregar. ' +
      'Solo disponible para usuarios con rol ADMIN (contiene datos financieros).',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas del dashboard.',
    type: DashboardResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'Rol insuficiente (requiere ADMIN).',
  })
  getMetrics(@CurrentWorkshop() workshopId: string) {
    return this.dashboardService.getMetrics(workshopId);
  }
}
