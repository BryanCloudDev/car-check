import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfiguration } from './common/config/env.config';
import { JoiValidationSchema } from './common/config/joi.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { UsersService } from './users/user.service';
import { PostsService } from './posts/post.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfiguration],
      validationSchema: JoiValidationSchema,
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [PostsService, UsersService],
})
export class AppModule {}
