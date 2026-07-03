# Backend — NestJS 11

API REST del monorepo Car Check. Corre en el puerto `3001`.

## Stack

- **NestJS 11** + **TypeScript**
- **Prisma 7** — ORM + migraciones
- **PostgreSQL 16** — base de datos
- **JWT** — autenticación stateless
- **AWS S3** — almacenamiento de media (presigned URLs)
- **Jest** — tests unitarios y e2e

## Desarrollo local

### 1. Variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y completar al menos:

```env
APP_ENV=dev                        # dev | qa | prod
JWT_SECRET=<openssl rand -base64 64>
```

Las variables AWS (`S3_BUCKET`, etc.) son opcionales hasta que necesites probar uploads.
Para obtenerlas: `cd infra/s3 && terraform workspace select dev && terraform output`.

### 2. Base de datos

```bash
# Desde la raíz del monorepo
make db/up        # levanta PostgreSQL en :5432 vía Docker
make db/migrate   # aplica migraciones pendientes
```

O directamente:

```bash
pnpm --filter backend prisma:migrate
pnpm --filter backend prisma:seed    # carga datos de prueba
```

### 3. Servidor de desarrollo

```bash
# Desde la raíz
pnpm dev

# Solo el backend
pnpm --filter backend dev
```

## Estructura

```
src/
  main.ts                    # Bootstrap — puerto, CORS, Swagger, validación global
  app.module.ts              # Módulo raíz
  common/
    constants.ts             # VIN_REGEX, PrismaErrorCode
    config/                  # env.config.ts, joi.validation.ts
    filters/                 # HttpExceptionFilter
    swagger/                 # Configuración centralizada de Swagger
    workshop-scope/          # Scoping multi-tenant por taller
  prisma/                    # PrismaService (global)
  auth/                      # JWT strategy, guard, decoradores
  vehicles/
  customers/
  work-orders/
  media/                     # Uploads S3 — presigned URLs
```

## API — Swagger

Con el servidor corriendo:

```
http://localhost:3001/docs
```

**Autenticarse en Swagger:**

1. `POST /api/auth/login` → copiar `accessToken`
2. Botón **Authorize** → pegar token → **Close**

## Tests

```bash
pnpm --filter backend test          # unitarios
pnpm --filter backend test:e2e      # e2e (requiere DB corriendo)
pnpm --filter backend test:cov      # cobertura
```

## Variables de entorno

| Variable                | Requerida | Descripción                                  |
| ----------------------- | --------- | -------------------------------------------- |
| `APP_ENV`               | Sí        | `dev` / `qa` / `prod`                        |
| `NODE_ENV`              | No        | `development` / `production` / `test`        |
| `PORT`                  | No        | Puerto del servidor (default: `3001`)        |
| `DATABASE_URL`          | Sí        | Connection string de PostgreSQL              |
| `JWT_SECRET`            | Sí        | Clave secreta para firmar tokens JWT         |
| `JWT_EXPIRATION`        | No        | Tiempo de vida del token (default: `86400s`) |
| `AWS_REGION`            | Sí        | Región AWS del bucket S3                     |
| `S3_BUCKET`             | Sí        | Nombre del bucket S3 (output de Terraform)   |
| `AWS_ACCESS_KEY_ID`     | Sí        | Credencial del usuario de servicio S3        |
| `AWS_SECRET_ACCESS_KEY` | Sí        | Credencial del usuario de servicio S3        |

> Las variables AWS se configuran automáticamente al correr `make infra/dev` (o `qa`/`prod`) desde la raíz. Ver sección de infraestructura en el README raíz.

## Deploy

Railway auto-despliega al hacer push a la rama vinculada usando `apps/backend/Dockerfile`.

Migraciones en producción:

```bash
railway run pnpm --filter backend prisma:deploy
```
