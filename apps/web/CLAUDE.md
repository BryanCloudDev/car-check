# Web — Next.js 16 + React 19 + Tailwind v4

## Estructura de rutas (App Router)

```
src/app/
  layout.tsx                     Root layout (html, body, globals.css)
  page.tsx                       redirect('/vehiculos')
  globals.css
  (auth)/login/page.tsx          Client component
  (app)/layout.tsx               Layout autenticado (sidebar, server action logout)
  (app)/vehiculos/page.tsx       Lista vehículos — server component
  (app)/clientes/page.tsx
  (app)/ordenes/page.tsx
  api/auth/login/route.ts        POST → backend /auth/login → setea cookie 'session'
src/components/SidebarNav.tsx    Nav del sidebar (client) — resalta el link activo
src/lib/api.ts                   apiFetch<T>() — helper para llamadas al backend
src/middleware.ts                Protege rutas autenticadas
```

## apiFetch

```ts
import { apiFetch } from '@/lib/api';

// En server components / route handlers — lee cookie 'session' automáticamente
const vehicles = await apiFetch<Vehicle[]>('/vehicles');
const order = await apiFetch<WorkOrder>(`/work-orders/${id}`, {
  method: 'POST',
  body: JSON.stringify(data),
});
```

- Lanza `Error` si `!res.ok` — manejar en el componente o con error boundary
- `cache: 'no-store'` por defecto — datos siempre frescos

## Sesión / Auth

- JWT en cookie `session` (httpOnly, sameSite: lax)
- El navegador **nunca** llama directamente a NestJS — siempre vía route handlers de Next
- `cookies()` de `next/headers` es **asíncrono**: `const store = await cookies()`
- `API_URL` (sin `NEXT_PUBLIC_`) en `.env.local` → `http://localhost:3001`

## Tailwind v4

- Sin `tailwind.config.js`
- En `globals.css`: `@import "tailwindcss"`
- PostCSS: `@tailwindcss/postcss`
- Clases igual que v3; no usar sintaxis legacy de config JS

## Convenciones de componentes

- Server components por defecto; agregar `'use client'` solo cuando sea necesario (interactividad, hooks)
- Tipos desde `@car-check/shared` — nunca desde `@prisma/client` en el frontend
- Middleware en `src/middleware.ts` excluye: `api/`, `_next/static/`, `_next/image/`, `favicon.ico`
