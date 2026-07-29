import { Module } from '@nestjs/common';
import { StorageModule } from '../common/storage/storage.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [VehiclesModule, StorageModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
})
export class WorkOrdersModule {}
