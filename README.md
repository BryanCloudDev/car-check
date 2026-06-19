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

---

## Requisitos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Node.js | 20 | https://nodejs.org |
| pnpm | 9 | `npm i -g pnpm@9` |
| Docker + Docker Compose | cualquiera reciente | https://docs.docker.com/get-docker |
| Terraform | 1.6+ | https://developer.hashicorp.com/terraform/install _(solo para infra S3)_ |
| AWS CLI | 2 | https://aws.amazon.com/cli _(solo para infra S3)_ |

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

| Campo | Valor |
|---|---|
| Email | `admin@tallercheck.sv` |
| Contraseña | `admin123` _(placeholder hasta que CAR-8 implemente bcrypt)_ |

### 6. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

Levanta backend (`:3001`) y frontend (`:3000`) en paralelo con hot-reload. Turbo gestiona el orden de arranque automáticamente.

---

## Comandos del día a día

Todos se ejecutan desde la **raíz** del monorepo.

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta backend + frontend con watch mode |
| `pnpm build` | Compila todos los paquetes en orden correcto |
| `pnpm lint` | Corre ESLint en todos los paquetes |
| `pnpm check-types` | Verifica tipos TypeScript en todos los paquetes |
| `pnpm format` | Formatea `.ts/.tsx/.md` con Prettier |

Para correr un comando solo en un paquete:

```bash
pnpm --filter backend <script>
pnpm --filter web <script>
```

---

## Base de datos (Prisma)

Todos estos comandos se ejecutan con el prefijo `pnpm --filter backend` desde la raíz.

| Comando | Qué hace | Cuándo usarlo |
|---|---|---|
| `prisma:generate` | Regenera Prisma Client y tipos en `packages/shared` | Después de cambiar `schema.prisma` |
| `prisma:migrate` | Crea y aplica una migración nueva (interactivo) | Al agregar/modificar modelos en desarrollo |
| `prisma:migrate:create` | Crea el SQL de migración sin aplicarla | Para revisar el SQL antes de aplicar |
| `prisma:migrate:status` | Muestra qué migraciones están aplicadas | Para diagnosticar el estado de la DB |
| `prisma:deploy` | Aplica migraciones pendientes sin interacción | **Deploy a producción** |
| `prisma:reset` | Borra y recrea la DB desde cero | Reset completo en desarrollo |
| `prisma:push` | Sincroniza el schema sin crear migración | Prototipado rápido (nunca en prod) |
| `prisma:studio` | Abre UI visual para explorar datos | Debugging e inspección manual |

### Flujo al modificar el schema

```bash
# 1. Editar apps/backend/prisma/schema.prisma
# 2. Crear y aplicar la migración (también regenera los tipos de packages/shared)
pnpm --filter backend prisma:migrate
```

---

## Infraestructura S3

El bucket S3 para uploads de media (fotos, documentos) se provisiona con Terraform en `infra/s3/`.

Esta sección solo es necesaria para quien va a crear o modificar la infraestructura. Si el bucket ya existe, solo necesitás que alguien te pase los valores de las 4 variables de entorno AWS.

### 1. Instalar Terraform

**macOS:**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Linux (Debian/Ubuntu):**
```bash
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

**Windows:** descargar el instalador desde https://developer.hashicorp.com/terraform/install

Verificar instalación:
```bash
terraform -version   # debe mostrar >= 1.6
```

### 2. Instalar y configurar AWS CLI

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
```

**Windows:** descargar el instalador desde https://aws.amazon.com/cli

Verificar instalación:
```bash
aws --version   # debe mostrar >= 2
```

### 3. Obtener credenciales AWS con los permisos necesarios

Terraform necesita un usuario IAM (o role) con permisos para crear recursos S3 e IAM. Si no tenés acceso a la consola AWS para crear ese usuario, pedíselo a quien administre la cuenta.

Los permisos mínimos que necesita ese usuario administrador son:
- `s3:CreateBucket`, `s3:PutBucketPolicy`, `s3:PutBucketCORS`, `s3:PutEncryptionConfiguration`, `s3:PutPublicAccessBlock`
- `iam:CreateUser`, `iam:CreateAccessKey`, `iam:PutUserPolicy`

Una vez que tengas el `Access Key ID` y `Secret Access Key` de ese usuario administrador:

```bash
aws configure
# AWS Access Key ID: <tu access key>
# AWS Secret Access Key: <tu secret key>
# Default region name: us-east-1  (o la región que uses)
# Default output format: json
```

Esto guarda las credenciales en `~/.aws/credentials`. Verificar que funciona:

```bash
aws sts get-caller-identity   # debe mostrar tu ARN sin error
```

### 4. Provisionar el bucket (primera vez)

```bash
cd infra/s3
cp terraform.tfvars.example terraform.tfvars
```

Editar `terraform.tfvars` y ajustar al menos:
- `env`: cambiar a `"production"` si es el entorno de prod
- `allowed_origins`: agregar el dominio real de Vercel junto a `localhost:3000`

```bash
terraform init          # descarga los providers de AWS (solo la primera vez)
terraform plan          # muestra qué recursos va a crear, sin aplicar nada
terraform apply         # crea el bucket, CORS, usuario IAM y access key
```

Terraform pedirá confirmación antes de aplicar. Escribir `yes`.

### 5. Obtener las credenciales generadas

Una vez aplicado, obtener los valores para las variables de entorno:

```bash
terraform output bucket_name
terraform output aws_region
terraform output iam_access_key_id
terraform output -raw iam_secret_access_key   # -raw porque es sensitivo
```

Copiar esos 4 valores a `apps/backend/.env` (local) o a las variables de entorno de Railway (producción). Ver sección [Backend — Railway](#backend--railway).

### Actualizar configuración existente

```bash
cd infra/s3
terraform plan    # ver qué cambiaría
terraform apply
```

> `terraform.tfvars` y el state (`.tfstate`) están en `.gitignore`. Nunca commitear credenciales ni el archivo de state.

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

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `openssl rand -base64 64` |
| `JWT_EXPIRATION` | `86400s` |
| `AWS_REGION` | región del bucket S3 |
| `S3_BUCKET` | `terraform output bucket_name` |
| `AWS_ACCESS_KEY_ID` | `terraform output iam_access_key_id` |
| `AWS_SECRET_ACCESS_KEY` | `terraform output -raw iam_secret_access_key` |

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

| Variable | Valor |
|---|---|
| `API_URL` | URL pública del backend en Railway (ej: `https://car-check-backend.up.railway.app`) |

---

## Referencia completa de scripts

### Raíz

| Script | Descripción |
|---|---|
| `pnpm dev` | Desarrollo con watch en todos los paquetes |
| `pnpm build` | Build de producción completo |
| `pnpm lint` | ESLint en todos los paquetes |
| `pnpm check-types` | Type check TypeScript en todos los paquetes |
| `pnpm format` | Formatear código con Prettier |

### Backend (`apps/backend`)

| Script | Descripción |
|---|---|
| `start:dev` | Servidor con hot-reload (vía `pnpm dev` desde raíz) |
| `start:prod` | Servidor desde build compilado |
| `build` | Compilar TypeScript a `dist/` |
| `test` | Tests unitarios con Jest |
| `test:watch` | Tests en modo watch |
| `test:cov` | Tests con reporte de cobertura |
| `test:e2e` | Tests end-to-end |
| `prisma:generate` | Regenerar Prisma Client + tipos shared |
| `prisma:migrate` | Crear y aplicar migración (dev) |
| `prisma:migrate:create` | Crear migración sin aplicar |
| `prisma:migrate:status` | Ver estado de migraciones |
| `prisma:deploy` | Aplicar migraciones pendientes (producción) |
| `prisma:reset` | Resetear DB completa |
| `prisma:push` | Sync schema sin migración (prototipado) |
| `prisma:seed` | Cargar datos de prueba en la DB local |
| `prisma:studio` | UI visual para explorar la DB |

### Frontend (`apps/web`)

| Script | Descripción |
|---|---|
| `dev` | Servidor de desarrollo en `:3000` |
| `build` | Build de producción |
| `start` | Servidor desde build de producción |
| `lint` | ESLint |
