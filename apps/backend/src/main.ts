import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { swaggerConfig, swaggerUiOptions } from './common/swagger/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new I18nValidationExceptionFilter({
      detailedErrors: false,
      responseBodyFormatter: (_host, exc, formattedErrors) => ({
        statusCode: exc.getStatus(),
        error: 'Solicitud inválida',
        message: formattedErrors,
      }),
    }),
  );

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, swaggerUiOptions);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
