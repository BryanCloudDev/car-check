import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkOrdersService } from './work-orders.service';
import { AdvanceStatusDto } from './dto/advance-status.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentWorkshop() workshopId: string,
    @Body() dto: CreateWorkOrderDto,
  ) {
    return this.workOrdersService.create(workshopId, dto);
  }

  @Get(':id/receipt.pdf')
  async getReceipt(
    @CurrentWorkshop() workshopId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const buffer = await this.workOrdersService.getReceipt(workshopId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${id}.pdf"`,
    });
    return new StreamableFile(buffer);
  }

  @Patch(':id/status')
  advanceStatus(
    @CurrentWorkshop() workshopId: string,
    @Param('id') id: string,
    @Body() dto: AdvanceStatusDto,
  ) {
    return this.workOrdersService.advanceStatus(workshopId, id, dto);
  }

  @Patch(':id')
  update(
    @CurrentWorkshop() workshopId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(workshopId, id, dto);
  }
}
