import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import {
  I18nContext,
  I18nService,
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';
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
  const i18n: I18nService = app.get(I18nService);
  app.useGlobalFilters(
    new HttpExceptionFilter(i18n),
    new I18nValidationExceptionFilter({
      detailedErrors: false,
      responseBodyFormatter: (host, exc, formattedErrors) => ({
        statusCode: exc.getStatus(),
        error: i18n.translate('common.errors.badRequest', {
          lang: I18nContext.current(host)?.lang,
        }),
        message: formattedErrors,
      }),
    }),
  );

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, swaggerUiOptions);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
