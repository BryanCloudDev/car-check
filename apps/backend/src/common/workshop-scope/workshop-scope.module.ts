import { Global, Module } from '@nestjs/common';
import { WorkshopScopeService } from './workshop-scope.service';

@Global()
@Module({
  providers: [WorkshopScopeService],
  exports: [WorkshopScopeService],
})
export class WorkshopScopeModule {}
