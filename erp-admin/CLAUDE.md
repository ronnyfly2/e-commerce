# ERP Admin — Vue 3 Dashboard

Stack: Vue 3 (Composition) + Pinia + Vue Router + Tailwind + Vite · VeeValidate + Zod · TanStack Table v8 · Axios · TS strict.
Release pages: https://github.com/vuejs/core/releases · https://github.com/vuejs/pinia/releases · https://github.com/tailwindlabs/tailwindcss/releases

> Detailed patterns (stores, API layer, forms, guards, a11y, perf): skill `vue-patterns`.

## Architecture
```
src/modules/<feature>/   # components/, composables/, stores/, views/, types.ts, api.ts
src/shared/              # generic UI components, global composables/stores (auth, ui), pure utils
src/router/              # index.ts, routes/ per module, guards.ts (auth, roles, dirty-form)
src/api/                 # client.ts (Axios + interceptors), endpoints.ts
```

## Hard Rules
- `<script setup lang="ts">` only; typed `defineProps`/`defineEmits`; components ≤ ~150 lines.
- HTTP only through `src/api/` — 401→refresh→retry→logout lives in the interceptor.
- Stores expose `readonly()` state; mutate only via actions; reset on logout.
- Routes auth-by-default (`meta.public` opts out); roles via `meta.roles`; lazy-load all views.
- Every async view shows loading / error+retry / empty states.
- Tailwind: no arbitrary values (`w-[347px]`); dark mode `class` strategy.

## Commands
`dev` · `build` · `preview` · `type-check` · `lint(:fix)` · `test(:ui)`
