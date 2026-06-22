import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentWorkshop } from '../auth/decorators/current-workshop.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post(':orderId/media/upload-url')
  @HttpCode(HttpStatus.OK)
  createUploadUrl(
    @CurrentWorkshop() workshopId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateUploadUrlDto,
  ) {
    return this.mediaService.createUploadUrl(workshopId, orderId, dto);
  }
}
