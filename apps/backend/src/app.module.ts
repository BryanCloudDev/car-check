import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfiguration } from './common/config/env.config';
import { JoiValidationSchema } from './common/config/joi.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkshopScopeModule } from './common/workshop-scope/workshop-scope.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CustomersModule } from './customers/customers.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfiguration],
      validationSchema: JoiValidationSchema,
    }),
    PrismaModule,
    WorkshopScopeModule,
    AuthModule,
    VehiclesModule,
    CustomersModule,
    WorkOrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
