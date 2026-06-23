import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Car Check API')
  .setDescription(
    'API REST para gestión de talleres mecánicos. Permite administrar vehículos, clientes, órdenes de trabajo y archivos multimedia.',
  )
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'access-token',
  )
  .build();

export const swaggerUiOptions: SwaggerCustomOptions = {
  swaggerOptions: { persistAuthorization: true },
};
