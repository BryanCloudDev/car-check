# Car Check

Plataforma de gestión para talleres mecánicos. Monorepo con backend NestJS, frontend Next.js y tipos compartidos.

```
apps/
  backend/   NestJS 11 + Prisma 7 + PostgreSQL  →  :3001
  web/       Next.js 16 + React 19 + Tailwind 4  →  :3000
packages/
  shared/    Tipos TypeScript generados desde schema.prisma
  ui/        Componentes React compartidos
infra/
  s3/        Terraform — bucket S3 + IAM para media uploads
```

## Entornos desplegados

| Entorno | Frontend (Vercel)                                                | Backend (Railway)                               |
| ------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| prod    | https://car-check-web.vercel.app                                 | https://backend-production-66534.up.railway.app |
| dev     | https://car-check-web-git-dev-bryanclouddevs-projects.vercel.app | https://backend-development-98e2.up.railway.app |

`main` despliega a prod y `dev` a development, de forma automática en cada push.
Cada push despliega **solo el servicio afectado**: el backend se filtra con
`watchPatterns` en `railway.toml` y la web con `turbo-ignore` en
`apps/web/vercel.json`.

La API cuelga de `/api` y Swagger de `/docs`. El frontend de dev está detrás del
deployment protection de Vercel, así que hay que estar logueado para abrirlo.

---

## Requisitos

| Herramienta             | Versión mínima      | Instalación                                                              |
| ----------------------- | ------------------- | ------------------------------------------------------------------------ |
| Node.js                 | 20                  | https://nodejs.org                                                       |
| pnpm                    | 9                   | `npm i -g pnpm@9`                                                        |
| Docker + Docker Compose | cualquiera reciente | https://docs.docker.com/get-docker                                       |
| Terraform               | 1.6+                | https://developer.hashicorp.com/terraform/install _(solo para infra S3)_ |
| AWS CLI                 | 2                   | https://aws.amazon.com/cli _(solo para infra S3)_                        |
| Railway CLI             | latest              | `curl -fsSL https://railway.app/install.sh \| sh` _(solo para infra S3)_ |

---

## Setup local (primera vez)

### 1. Instalar dependencias

```bash
pnpm install
```

Instala todas las dependencias del monorepo y ejecuta `prisma generate` automáticamente vía el `postinstall` del backend.

### 2. Configurar variables de entorno

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

`apps/backend/.env` necesita al menos un `JWT_SECRET` seguro antes de correr:

```bash
openssl rand -base64 64
# Pegar el resultado en JWT_SECRET=
```

Las variables de AWS (`AWS_REGION`, `S3_BUCKET`, etc.) son opcionales en desarrollo local hasta que se implemente la funcionalidad de uploads (CAR-23).

### 3. Levantar la base de datos

```bash
docker compose -f apps/backend/docker-compose.yml up -d
```

Levanta PostgreSQL 16 en el puerto `5432`. Los datos se persisten en un volumen Docker.

### 4. Aplicar migraciones

```bash
pnpm --filter backend prisma:migrate
```

Crea y aplica todas las migraciones pendientes sobre la base de datos local.

### 5. Cargar datos de prueba

```bash
pnpm --filter backend prisma:seed
```

Crea un taller demo y un usuario ADMIN de prueba en la base de datos local. Es idempotente: se puede correr más de una vez sin duplicar datos.

| Campo      | Valor                                                        |
| ---------- | ------------------------------------------------------------ |
| Email      | `admin@tallercheck.sv`                                       |
| Contraseña | `admin123` _(placeholder hasta que CAR-8 implemente bcrypt)_ |

### 6. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

Levanta backend (`:3001`) y frontend (`:3000`) en paralelo con hot-reload. Turbo gestiona el orden de arranque automáticamente.

---

## Comandos del día a día

Todos se ejecutan desde la **raíz** del monorepo.

| Comando            | Qué hace                                        |
| ------------------ | ----------------------------------------------- |
| `pnpm dev`         | Levanta backend + frontend con watch mode       |
| `pnpm build`       | Compila todos los paquetes en orden correcto    |
| `pnpm lint`        | Corre ESLint en todos los paquetes              |
| `pnpm check-types` | Verifica tipos TypeScript en todos los paquetes |
| `pnpm format`      | Formatea `.ts/.tsx/.md` con Prettier            |

Para correr un comando solo en un paquete:

```bash
pnpm --filter backend <script>
pnpm --filter web <script>
```

### Infraestructura (Makefile)

| Comando           | Qué hace                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `make infra/init` | Inicializa Terraform (primera vez)                                  |
| `make infra/dev`  | Provisiona bucket S3 dev y sube vars a Railway                      |
| `make infra/qa`   | Provisiona bucket S3 qa y sube vars a Railway                       |
| `make infra/prod` | Provisiona bucket S3 prod y sube vars a Railway (pide confirmación) |
| `make db/up`      | Levanta PostgreSQL local vía Docker                                 |
| `make db/migrate` | Aplica migraciones Prisma                                           |

---

## Git Hooks (Husky)

Los hooks se instalan automáticamente al correr `pnpm install` gracias a Husky.

### pre-commit — corre en cada `git commit`

| Paso           | Qué hace                                                                            |
| -------------- | ----------------------------------------------------------------------------------- |
| `lint-staged`  | Prettier + ESLint solo sobre los archivos staged (más rápido que lintear todo)      |
| `check-types`  | Verificación de tipos TypeScript en todos los paquetes                              |
| `backend test` | Suite de tests unitarios del backend (`--passWithNoTests` no falla si no hay tests) |

> Si alguno de estos pasos falla, el commit se cancela. Corregir el error y volver a intentarlo.

### pre-push — corre en cada `git push`

| Paso               | Qué hace                                                             |
| ------------------ | -------------------------------------------------------------------- |
| `build`            | Build completo de todos los paquetes (asegura que compila en limpio) |
| `backend test:e2e` | Suite de tests end-to-end del backend contra la DB local             |

> El push se cancela si el build falla o algún test e2e no pasa.

---

## API — Documentación interactiva (Swagger)

Con el backend corriendo, la documentación completa de la API está disponible en:

```
http://localhost:3001/docs
```

Incluye todos los endpoints con esquemas de request/response, ejemplos de valores y soporte para autenticación JWT directamente desde el navegador.

**Cómo autenticarse en Swagger UI:**

1. Expandir `POST /api/auth/login` → **Try it out** → ejecutar con credenciales válidas
2. Copiar el `accessToken` del response
3. Click en el botón **Authorize** 🔒 (arriba a la derecha)
4. Pegar el token → **Authorize** → **Close**
5. Todos los endpoints protegidos quedan autenticados en la sesión

> El token se mantiene entre navegaciones gracias a `persistAuthorization`.

---

## Roles y permisos

Cada usuario tiene un rol (`ADMIN` o `MECANICO`) que viaja dentro del JWT. La
autorización se aplica en el **backend** (fuente de verdad) y se refleja en la
**UI** ocultando o deshabilitando acciones.

| Acción                                    | ADMIN | MECÁNICO |
| ----------------------------------------- | :---: | :------: |
| Ver dashboard / ingresos del taller       |  ✅   |    ❌    |
| Ver órdenes y sus trabajos                |  ✅   |    ✅    |
| Ver costos / precios / totales de órdenes |  ✅   |    ❌    |
| Crear y editar órdenes + cambiar estado   |  ✅   |    ✅    |
| Ver clientes                              |  ✅   |    ✅    |
| Crear y editar clientes                   |  ✅   |    ✅    |
| Borrar clientes                           |  ✅   |    ❌    |
| Gestión de usuarios                       |  ✅   |    ❌    |

**Backend** — se restringe con `RolesGuard` + `@Roles(...)` sobre los endpoints
sensibles (un acceso no autorizado devuelve `403`). Ver detalle del patrón en
`apps/backend/CLAUDE.md`.

**Frontend** — el rol se obtiene desde `GET /api/auth/me` y condiciona la UI
(ej: el dashboard es solo ADMIN, los costos se ocultan al MECÁNICO). Ocultar en
la UI es solo UX: la seguridad real la garantiza el backend.

---

## Base de datos (Prisma)

Todos estos comandos se ejecutan con el prefijo `pnpm --filter backend` desde la raíz.

| Comando                 | Qué hace                                            | Cuándo usarlo                              |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| `prisma:generate`       | Regenera Prisma Client y tipos en `packages/shared` | Después de cambiar `schema.prisma`         |
| `prisma:migrate`        | Crea y aplica una migración nueva (interactivo)     | Al agregar/modificar modelos en desarrollo |
| `prisma:migrate:create` | Crea el SQL de migración sin aplicarla              | Para revisar el SQL antes de aplicar       |
| `prisma:migrate:status` | Muestra qué migraciones están aplicadas             | Para diagnosticar el estado de la DB       |
| `prisma:deploy`         | Aplica migraciones pendientes sin interacción       | **Deploy a producción**                    |
| `prisma:reset`          | Borra y recrea la DB desde cero                     | Reset completo en desarrollo               |
| `prisma:push`           | Sincroniza el schema sin crear migración            | Prototipado rápido (nunca en prod)         |
| `prisma:studio`         | Abre UI visual para explorar datos                  | Debugging e inspección manual              |

### Flujo al modificar el schema

```bash
# 1. Editar apps/backend/prisma/schema.prisma
# 2. Crear y aplicar la migración (también regenera los tipos de packages/shared)
pnpm --filter backend prisma:migrate
```

---

## Infraestructura S3

El bucket S3 para uploads de media (fotos, videos) se provisiona con Terraform en `infra/s3/`. Hay un bucket separado por entorno (`dev`, `qa`, `prod`) gestionado con Terraform workspaces.

Esta sección solo es necesaria para quien crea o modifica infraestructura. Si los buckets ya existen, solo necesitás que alguien te pase las variables de entorno AWS correspondientes a tu entorno.

### Estructura

```
infra/
  s3/
    main.tf                  # Bucket S3 + IAM de servicio
    variables.tf
    outputs.tf
    envs/
      dev.tfvars             # Config del entorno dev
      qa.tfvars              # Config del entorno qa
      prod.tfvars            # Config del entorno prod
  bootstrap/
    terraform-iam-policy.json  # Política IAM mínima para el usuario de Terraform
  scripts/
    provision.sh             # Aprovisiona un entorno y sube vars a Railway automáticamente
```

Naming de buckets: `car-check-media-{env}-{sufijo-aleatorio}`

### Requisitos previos (una sola vez)

#### 1. Instalar Terraform

**macOS:**

```bash
brew tap hashicorp/tap && brew install hashicorp/tap/terraform
```

**Linux (Debian/Ubuntu):**

```bash
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
terraform -version   # debe mostrar >= 1.6
```

#### 2. Instalar AWS CLI

**macOS:** `brew install awscli`

**Linux:**

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
aws --version   # debe mostrar >= 2
```

#### 3. Instalar Railway CLI

```bash
curl -fsSL https://railway.app/install.sh | sh
railway login
railway link   # vincular al proyecto Car Check desde la raíz del repo
```

#### 4. Crear el usuario IAM de Terraform en AWS (una sola vez por cuenta)

En la consola AWS:

1. **IAM → Policies → Create policy** → pegar el JSON de `infra/bootstrap/terraform-iam-policy.json` → nombrarla `car-check-terraform-policy`
2. **IAM → Users → Create user** → nombre `car-check-terraform` → adjuntar `car-check-terraform-policy`
3. Dentro del usuario → **Security credentials → Create access key** → use case: CLI → copiar el ID y el secret

Configurar las credenciales localmente con un perfil dedicado:

```bash
aws configure --profile car-check
# AWS Access Key ID:     AKIA...
# AWS Secret Access Key: ...
# Default region:        us-east-1
# Default output format: json
```

Verificar:

```bash
aws sts get-caller-identity --profile car-check   # debe mostrar el ARN sin error
```

> Este usuario (`car-check-terraform`) solo se usa para correr Terraform. Los outputs de Terraform generan un segundo usuario de menor privilegio (`car-check-s3-{env}`) cuyas credenciales son las que van a Railway y al `.env` de la app.

#### 5. Inicializar Terraform

```bash
make infra/init
```

### Aprovisionar un entorno

Un solo comando crea el bucket, configura CORS y cifrado, crea el usuario IAM de servicio, y sube todas las variables directamente al entorno de Railway:

```bash
make infra/dev    # provisiona dev  → sube vars a Railway env "dev"
make infra/qa     # provisiona qa   → sube vars a Railway env "qa"
make infra/prod   # provisiona prod → sube vars a Railway env "prod" (pide confirmación)
```

Las variables que se configuran automáticamente en Railway son:

| Variable                | Descripción                        |
| ----------------------- | ---------------------------------- |
| `APP_ENV`               | `dev` / `qa` / `prod`              |
| `AWS_REGION`            | Región del bucket                  |
| `S3_BUCKET`             | Nombre del bucket creado           |
| `AWS_ACCESS_KEY_ID`     | Credencial del usuario de servicio |
| `AWS_SECRET_ACCESS_KEY` | Credencial del usuario de servicio |

> Para desarrollo local, copiar esos valores manualmente a `apps/backend/.env` corriendo `cd infra/s3 && terraform workspace select dev && terraform output`.

### Actualizar configuración existente

```bash
# Editar envs/dev.tfvars (ej: agregar un nuevo allowed_origin)
make infra/dev   # plan + apply + sync a Railway
```

---

## Deploy

### CI — automático (GitHub Actions)

En cada push a `main` o `dev` y en cada PR a `main` se corre automáticamente:

1. `pnpm lint`
2. `pnpm check-types`
3. `pnpm build`

Configuración en `.github/workflows/ci.yml`.

---

### Backend — Railway

El backend se despliega automáticamente al hacer merge a `main` usando `apps/backend/Dockerfile`.

**Variables que Railway inyecta automáticamente:**

- `DATABASE_URL` — base de datos PostgreSQL de Railway
- `PORT`

**Variables que hay que agregar manualmente en el dashboard de Railway:**

| Variable                                                                | Valor                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `NODE_ENV`                                                              | `production`                                                 |
| `APP_ENV`                                                               | `dev` / `qa` / `prod` — según el entorno de Railway          |
| `JWT_SECRET`                                                            | `openssl rand -base64 64`                                    |
| `JWT_EXPIRATION`                                                        | `86400s`                                                     |
| `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Se configuran automáticamente vía `make infra/dev\|qa\|prod` |

**Migraciones en producción** — correr una sola vez después de cada deploy que cambie el schema:

```bash
railway run pnpm --filter backend prisma:deploy
```

---

### Frontend — Vercel

El frontend se despliega automáticamente al hacer merge a `main`.

**Configuración en Vercel:**

- Root Directory: `apps/web`
- Framework Preset: Next.js (autodetectado)

**Variable de entorno en Vercel:**

| Variable  | Valor                                                                               |
| --------- | ----------------------------------------------------------------------------------- |
| `API_URL` | URL pública del backend en Railway (ej: `https://car-check-backend.up.railway.app`) |

---

## Referencia completa de scripts

### Raíz

| Script             | Descripción                                 |
| ------------------ | ------------------------------------------- |
| `pnpm dev`         | Desarrollo con watch en todos los paquetes  |
| `pnpm build`       | Build de producción completo                |
| `pnpm lint`        | ESLint en todos los paquetes                |
| `pnpm check-types` | Type check TypeScript en todos los paquetes |
| `pnpm format`      | Formatear código con Prettier               |

### Backend (`apps/backend`)

| Script                  | Descripción                                         |
| ----------------------- | --------------------------------------------------- |
| `start:dev`             | Servidor con hot-reload (vía `pnpm dev` desde raíz) |
| `start:prod`            | Servidor desde build compilado                      |
| `build`                 | Compilar TypeScript a `dist/`                       |
| `test`                  | Tests unitarios con Jest                            |
| `test:watch`            | Tests en modo watch                                 |
| `test:cov`              | Tests con reporte de cobertura                      |
| `test:e2e`              | Tests end-to-end                                    |
| `prisma:generate`       | Regenerar Prisma Client + tipos shared              |
| `prisma:migrate`        | Crear y aplicar migración (dev)                     |
| `prisma:migrate:create` | Crear migración sin aplicar                         |
| `prisma:migrate:status` | Ver estado de migraciones                           |
| `prisma:deploy`         | Aplicar migraciones pendientes (producción)         |
| `prisma:reset`          | Resetear DB completa                                |
| `prisma:push`           | Sync schema sin migración (prototipado)             |
| `prisma:seed`           | Cargar datos de prueba en la DB local               |
| `prisma:studio`         | UI visual para explorar la DB                       |

### Frontend (`apps/web`)

| Script  | Descripción                        |
| ------- | ---------------------------------- |
| `dev`   | Servidor de desarrollo en `:3000`  |
| `build` | Build de producción                |
| `start` | Servidor desde build de producción |
| `lint`  | ESLint                             |
