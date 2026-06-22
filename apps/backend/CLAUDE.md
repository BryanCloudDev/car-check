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
where: { role: UserRole.ADMIN }
data: { status: OrderStatus.EN_PROCESO }

// ✗
where: { role: 'ADMIN' }
```

## Patrones de servicio

- Inyectar `PrismaService` (no instanciar directamente)
- Errores de Prisma → capturar y mapear a excepciones NestJS (`NotFoundException`, `ConflictException`)
- Workshop scope: todos los recursos son privados por taller — incluir siempre `workshopId` en queries
- VIN: validar con `VIN_REGEX` de `common/constants.ts`

## Archivos por módulo

Cada módulo tiene: `module.ts`, `controller.ts`, `service.ts`, `dto/`.
Tests en `*.spec.ts` junto al archivo que testean.
