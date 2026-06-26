---
name: nuxt-patterns
description: Use when writing or reviewing code in frontend-client/ — Nuxt 3 routeRules, data fetching, BFF server routes, SEO/schema.org, Core Web Vitals, Pinia hydration.
---

# Nuxt 3 Storefront Patterns

## Rendering — routeRules
```typescript
// nuxt.config.ts
routeRules: {
  '/':            { prerender: true },   // SSG — CDN-cacheable
  '/products/**': { swr: 60 },           // ISR — fresh stock/price, no rebuild
  '/checkout/**': { ssr: false },        // CSR — session data, no SSR value
  '/account/**':  { ssr: true },         // personalized, auth-gated
}
```

## Data Fetching
- `useFetch` for route-lifecycle data; `useAsyncData` for custom keys/parallel fetches.
- `$fetch` only for event handlers (submit, click) — never in `setup`.
- User-specific data (cart, wishlist): `{ server: false, lazy: true }`.

## BFF Server Routes
```typescript
// server/api/products/index.get.ts
export default defineEventHandler(async (event) => {
  const validated = productsQuerySchema.parse(getQuery(event)); // Zod — always
  return $fetch(`${config.apiUrl}/products`, {
    headers: { authorization: getAuthHeader(event) },
    query: validated,
  });
});
```
Server routes are public API surface: validate every input, set cache headers on public endpoints, never forward raw cookies/tokens in the response body.

## SEO — every page
```typescript
useSeoMeta({
  title: () => `${product.name} | My Store`,
  description: () => product.shortDescription,
  ogImage: () => product.imageUrl,
  ogType: 'product',
});
useSchemaOrg([defineProduct({…}), defineBreadcrumb({…})]);
```

## Pinia Hydration-Safe
```typescript
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  if (import.meta.client) {
    watch(items, v => localStorage.setItem('cart', JSON.stringify(v)), { deep: true });
  }
  return { items: readonly(items) };
});
```
`$patch` for batch updates. Any `window`/`localStorage` access behind `import.meta.client`.

## Core Web Vitals targets
- **LCP < 2.5s**: preload hero image, `fetchpriority="high"` on first image, `preconnect` + `font-display: swap`.
- **CLS < 0.1**: width/height on every `<NuxtImg>`; reserve space for async content.
- **INP < 200ms**: defer non-critical scripts; keep interaction handlers light.
- Below-the-fold: `<LazyXxx />` auto-prefix.

## A11y & Errors
- Semantic HTML (`nav/main/article`); skip-to-content link first in `default.vue`; product card = one `<a>` with descriptive `aria-label`.
- `error.vue` branded for 404/500; inline error + retry for `useAsyncData` failures; checkout errors keep cart and form data.

## i18n (if enabled)
`@nuxtjs/i18n`, strategy `prefix_except_default`; all strings via `$t('key')`.
