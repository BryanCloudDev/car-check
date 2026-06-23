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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get(':vin')
  findOne(@Param('vin') vin: string) {
    return this.vehiclesService.findOne(vin);
  }

  @Patch(':vin')
  update(@Param('vin') vin: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(vin, dto);
  }

  @Get(':vin/history')
  getHistory(@CurrentWorkshop() workshopId: string, @Param('vin') vin: string) {
    return this.vehiclesService.getHistory(workshopId, vin);
  }
}
