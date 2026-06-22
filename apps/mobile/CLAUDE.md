# Mobile — Expo 56 + React Native 0.85 + Expo Router

## Estado actual

App en etapa inicial (skeleton). Estructura base con Expo Router.

## Stack

- Expo SDK 56 — **leer docs versionadas**: https://docs.expo.dev/versions/v56.0.0/
- React Native 0.85, React 19
- Expo Router v4 (file-based routing, como Next.js App Router)
- TypeScript 6

## Estructura

```
src/app/
  _layout.tsx    Root layout (Stack navigator)
  index.tsx      Pantalla inicial
```

## Convenciones

- Routing basado en archivos bajo `src/app/` — igual que Next.js App Router
- Layouts con `_layout.tsx`; pantallas con nombres directos (`index.tsx`, `[id].tsx`)
- Estilos con `StyleSheet.create()` — no Tailwind
- Tipos desde `@car-check/shared` cuando el mobile workspace lo tenga como dependencia
- No importar desde `@prisma/client` nunca en mobile

## Comandos

```bash
pnpm --filter mobile start        # Metro bundler
pnpm --filter mobile android      # Android
pnpm --filter mobile ios          # iOS
```

## Notas importantes

- La app mobile NO está en Turborepo por defecto (Expo tiene su propio bundler)
- Verificar siempre la versión exacta de APIs en https://docs.expo.dev/versions/v56.0.0/ antes de escribir código
