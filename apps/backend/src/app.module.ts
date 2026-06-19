import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfiguration } from './common/config/env.config';
import { JoiValidationSchema } from './common/config/joi.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkshopScopeModule } from './common/workshop-scope/workshop-scope.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
