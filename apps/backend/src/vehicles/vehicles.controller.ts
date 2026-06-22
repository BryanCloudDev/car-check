import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { VehiclesService } from './vehicles.service';

@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get(':vin/history')
  getHistory(@CurrentWorkshop() workshopId: string, @Param('vin') vin: string) {
    return this.vehiclesService.getHistory(workshopId, vin);
  }
}
