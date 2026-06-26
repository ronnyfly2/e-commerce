# Frontend Client — Nuxt 3 Storefront

Stack: Nuxt 3 + @pinia/nuxt + @nuxtjs/tailwindcss + @nuxt/image + @nuxtjs/seo · VeeValidate + Zod · TS strict.
Release pages: https://github.com/nuxt/nuxt/releases · https://github.com/vuejs/pinia/releases · https://github.com/tailwindlabs/tailwindcss/releases

> Detailed patterns (routeRules, BFF, SEO, CWV, hydration): skill `nuxt-patterns`.

## Architecture (srcDir: 'app')
```
app/modules/<feature>/   # feature components/composables/stores
app/components|composables|stores|utils/   # global, auto-imported
app/pages/               # file-based routing (index, products/[slug], checkout/…)
app/layouts/             # default, checkout (minimal), error
app/server/api/          # BFF routes ([name].get.ts) — proxy to backend, Zod-validate every input
app/middleware|plugins/
```

## Hard Rules
- Rendering per route: home/category SSG · product detail `swr: 60` · cart/checkout `ssr: false` · account SSR.
- `useFetch`/`useAsyncData` in setup; `$fetch` only on events; never call backend directly — always via `server/api/` BFF.
- `useSeoMeta()` + `useSchemaOrg()` on every page.
- All images via `<NuxtImg>` with width/height; below-fold components `<LazyXxx />`.
- Client-only APIs (`localStorage`, `window`) behind `import.meta.client`.
- Checkout errors never lose the cart. Strings via `$t()` if i18n enabled.

## Commands
`dev` · `build` · `generate` · `preview` · `type-check` · `lint(:fix)` · `test` · `analyze`
