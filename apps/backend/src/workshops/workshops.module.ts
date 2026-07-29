import { Module } from '@nestjs/common';
import { StorageModule } from '../common/storage/storage.module';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [StorageModule],
  controllers: [WorkshopsController],
  providers: [WorkshopsService],
})
export class WorkshopsModule {}
