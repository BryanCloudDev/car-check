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
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@CurrentWorkshop() workshopId: string) {
    return this.customersService.findAll(workshopId);
  }

  @Get(':id')
  findOne(@CurrentWorkshop() workshopId: string, @Param('id') id: string) {
    return this.customersService.findOne(workshopId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentWorkshop() workshopId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(workshopId, dto);
  }

  @Patch(':id')
  update(
    @CurrentWorkshop() workshopId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(workshopId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentWorkshop() workshopId: string, @Param('id') id: string) {
    return this.customersService.remove(workshopId, id);
  }
}
