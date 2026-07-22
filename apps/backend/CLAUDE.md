# Backend — NestJS 11 + Prisma 7

## Estructura de módulos

```
src/
  main.ts
  app.module.ts
  common/
    constants.ts           # VIN_REGEX, PrismaErrorCode — constantes compartidas entre módulos
    config/                # env.config.ts, joi.validation.ts
    workshop-scope/        # WorkshopScopeModule — scoping multi-tenant
  prisma/                  # PrismaModule (global)
  auth/
  vehicles/
  customers/
  work-orders/
  media/
```

## Convención de constantes

- **Constantes inter-módulo** → `src/common/constants.ts`
- **Constantes de módulo** → `src/<module>/<module>.constants.ts`
- Nunca usar magic strings de Prisma directamente:

  ```ts
  // ✓
  import { PrismaErrorCode } from '../common/constants';
  if (e.code === PrismaErrorCode.NOT_FOUND) { ... }

  // ✗
  if (e.code === 'P2025') { ... }
  ```

## Enums en DTOs

```ts
// ✓ — usar el objeto enum generado
import { OrderStatus } from '../../generated/prisma/client';
@IsEnum(OrderStatus)
status: OrderStatus;

// ✗ — nunca arrays inline
@IsEnum(['RECIBIDO', 'EN_PROCESO', ...])
```

Importar enums desde `'../../generated/prisma/client'` (ajustar ruta relativa).

## Literales de enum en servicios

Siempre usar el literal tipado, nunca strings:

```ts
// ✓
import { UserRole, OrderStatus } from '../generated/prisma/client';
where: {
  role: UserRole.ADMIN;
}
data: {
  status: OrderStatus.EN_PROCESO;
}

// ✗
where: {
  role: 'ADMIN';
}
```

## Patrones de servicio

- Inyectar `PrismaService` (no instanciar directamente)
- Errores de Prisma → capturar y mapear a excepciones NestJS (`NotFoundException`, `ConflictException`)
- Workshop scope: todos los recursos son privados por taller — incluir siempre `workshopId` en queries
- VIN: validar con `VIN_REGEX` de `common/constants.ts`

## Autorización por rol (RBAC)

Roles: `UserRole` = `ADMIN | MECANICO`. El rol viaja en el JWT (`payload.role`) y
queda disponible en `request.user.role` tras `JwtAuthGuard`.

Para restringir un endpoint a ciertos roles, combinar `RolesGuard` (a nivel de
controller) con `@Roles(...)` (a nivel de handler):

```ts
import { UserRole } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard) // ← ambos, en este orden
@Controller('customers')
export class CustomersController {
  @Delete(':id')
  @Roles(UserRole.ADMIN) // sin @Roles → cualquier usuario autenticado
  remove() { ... }
}
```

- Un endpoint sin `@Roles` pasa el `RolesGuard` (solo exige JWT válido).
- `RolesGuard` lanza `403 Forbidden` si el rol no coincide — documentarlo en Swagger.
- Para inyectar el usuario autenticado completo: `@CurrentUser()` (además del
  `@CurrentWorkshop()` existente).
- `GET /api/auth/me` devuelve el usuario actual (con `role`, sin `passwordHash`);
  es la fuente de verdad del rol para el frontend.

## Archivos por módulo

Cada módulo tiene: `module.ts`, `controller.ts`, `service.ts`, `dto/`.
Tests en `*.spec.ts` junto al archivo que testean.

## Swagger — obligatorio en todo endpoint nuevo

La UI está en `/docs` (no lleva prefijo `/api`). Config centralizada en `src/common/swagger/config.ts`.

### Controllers

```ts
// En cada controller nuevo — decoradores de clase:
@ApiTags('nombre-del-recurso')
@ApiBearerAuth('access-token')                         // si requiere JWT
@ApiResponse({ status: 401, description: 'No autorizado. Token JWT inválido o ausente.' })

// En cada endpoint:
@ApiOperation({ summary: 'Verbo corto', description: 'Detalle opcional.' })
@ApiParam({ name: 'id', description: 'ID del recurso (UUID)' })  // para :param
@ApiResponse({ status: 200, description: 'Descripción.', type: ResponseDto })
@ApiResponse({ status: 400, description: 'Datos inválidos.' })
@ApiResponse({ status: 404, description: 'No encontrado.' })
```

### DTOs — request

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Campo obligatorio
@ApiProperty({ description: 'Descripción', example: 'valor' })
campo: string;

// Campo opcional
@ApiPropertyOptional({ description: 'Descripción', example: 'valor' })
campo?: string;

// Enum
@ApiProperty({ enum: OrderStatus, example: OrderStatus.EN_PROCESO })
status: OrderStatus;

// Array de objetos anidados
@ApiProperty({ type: [CreateOrderItemDto] })
items: CreateOrderItemDto[];
```

### DTOs — response

Crear un archivo `<resource>.response.ts` cuando el endpoint devuelve un cuerpo documentable:

```ts
// src/auth/dto/auth-token.response.ts — ejemplo de referencia
export class AuthTokenResponse {
  @ApiProperty({ description: 'Token JWT', example: 'eyJ...' })
  accessToken: string;
}
```

### Seguridad JWT en Swagger

El esquema Bearer se llama `'access-token'` — este nombre debe coincidir exactamente entre:

- `addBearerAuth({...}, 'access-token')` en `config.ts`
- `@ApiBearerAuth('access-token')` en cada controller protegido
