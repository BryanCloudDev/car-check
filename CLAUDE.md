# Car Check — Monorepo

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Package manager**: pnpm 9 — siempre usar `pnpm`, nunca npm/yarn
- **apps/backend**: NestJS 11, Prisma 7, PostgreSQL — puerto 3001
- **apps/web**: Next.js 16, React 19, Tailwind v4, App Router — puerto 3000
- **apps/mobile**: Expo 56, React Native 0.85, Expo Router
- **packages/shared**: `@car-check/shared` — tipos TS generados desde schema.prisma
- **packages/ui**: `@repo/ui` — componentes React compartidos

## Comandos

```bash
pnpm dev                          # arranca todo en paralelo (turbo)
pnpm --filter backend dev         # solo backend
pnpm --filter web dev             # solo web
pnpm --filter backend prisma:generate  # regenera tipos tras cambiar schema.prisma
pnpm build && pnpm lint && pnpm check-types  # CI local
```

## Convenciones globales

- Paquetes internos: prefijo `@repo/` (ui, typescript-config, eslint-config), excepto `@car-check/shared`
- `packages/shared/src/generated.ts` es auto-generado — **nunca editar a mano**
- `packages/shared/src/index.ts` re-exporta selectivamente; `User` excluye `passwordHash`
- Enums en `@car-check/shared` como union literals, nunca `enum` de TS ni importar `@prisma/client` ahí
- NO incluir `Co-Authored-By: Claude` en commits

## CI/CD

- **Backend**: Railway — auto-deploy desde GitHub, Dockerfile en `apps/backend/Dockerfile`
- **Frontend**: Vercel — Root Directory `apps/web`
- **CI**: `.github/workflows/ci.yml` — lint + check-types + build
- Migraciones Prisma: correr manualmente via `railway run`
