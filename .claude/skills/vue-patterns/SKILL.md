---
name: vue-patterns
description: Use when writing or reviewing code in erp-admin/ — Vue 3 components, Pinia stores, Axios layer, VeeValidate forms, router guards, a11y, list performance.
---

# Vue 3 Admin Patterns

## Pinia Store
```typescript
export const useOrderStore = defineStore('orders', () => {
  const list = ref<Order[]>([]);
  const isLoading = ref(false);

  async function fetchAll(params: OrderFilters) {
    isLoading.value = true;
    try {
      list.value = await orderApi.getAll(params);
    } finally {
      isLoading.value = false;
    }
  }

  return { list: readonly(list), isLoading: readonly(isLoading), fetchAll };
});
```
State out as `readonly()`; complex logic in composables, actions stay thin; clear on logout.

## API Layer
```typescript
// api/client.ts
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });
client.interceptors.request.use(attachAccessToken);
client.interceptors.response.use(identity, handleRefreshOrLogout); // 401→refresh→retry→logout
```
One typed function per endpoint in the module's `api.ts`. Components/stores never call axios directly.

## Components
- Emits typed: `defineEmits<{ (e: 'update:modelValue', v: string): void }>()`.
- `withDefaults(defineProps<…>(), {…})` for optionals; `defineExpose` only when a parent truly needs it.
- No `v-html`; if unavoidable, DOMPurify first.

## Forms
VeeValidate `useForm` + Zod schema. Validate on blur, per-field errors, disable submit while `isSubmitting`, on success invalidate store data + toast.

## Router Guards
- `guards.ts` beforeEach: redirect unauthenticated unless `meta.public`; check `meta.roles`.
- Dirty-form: warn before leaving unsaved forms (`onBeforeRouteLeave`).

## Async View States
```
loading → skeleton/spinner · error → message + retry · empty → illustration + CTA
```

## Performance

### Directive selection
- `v-if` — adds/removes DOM; use when the condition is rarely true or on page load guards.
- `v-show` — toggles `display:none`; use for panels that toggle frequently (filters, tabs).
- `v-memo="[dep1, dep2]"` — skips VDOM diff unless deps change; use on expensive list rows.
- Always set `:key` on `v-for` items; prefer stable DB IDs, never array index on mutable lists.

### Reactivity budget
- `shallowRef`/`shallowReactive` for large objects/arrays; deep reactivity only when actually needed.
- **Computed** for derived/transformed data (cached automatically).
- **Watch** only for side-effects (API calls, localStorage, timers) — never use watch to derive state.
- Debounce search inputs and heavy filters with `useDebounceFn` (VueUse):
  ```typescript
  const search = ref('');
  const doSearch = useDebounceFn(() => store.fetchAll({ q: search.value }), 300);
  ```

### Code splitting
Lazy-load any component not needed on first paint:
```typescript
// Heavy modals, charts, bulk-action panels
const BulkEditModal = defineAsyncComponent(() => import('./BulkEditModal.vue'));
```
Route-level splitting is automatic with Vite's dynamic imports in the router; never import page components statically.

### Component caching
Wrap tab/wizard panels with `<KeepAlive>` to preserve state and avoid redundant API calls when users switch back:
```html
<KeepAlive :include="['OrderFilters', 'InventoryTable']">
  <component :is="activePanel" />
</KeepAlive>
```

### Async UI states with Suspense
```html
<Suspense>
  <template #default><HeavyDashboard /></template>
  <template #fallback><SkeletonDashboard /></template>
</Suspense>
```
Use `<Suspense>` + skeleton (not spinner) for route-level async components in the admin dashboard.

### Large lists
- Virtualize any list > 100 rows: TanStack Virtual or `vue-virtual-scroller`.
- Pair with server-side pagination; never fetch unbounded collections.

### Bundle hygiene
- Run `rollup-plugin-visualizer` (`npm i -D rollup-plugin-visualizer`) to audit bundle composition; check **brotli** size, not raw size.
- Tree-shake icon libraries — import individual icons, never the full set.
- Audit and uninstall unused dependencies before each release.

## A11y (WCAG AA)
Keyboard-navigable with visible focus; `alt` on images, `aria-label` on icon buttons; modals trap focus, Escape closes, focus returns on close; AA contrast.

## Tailwind
Extend theme in `tailwind.config.ts` (never override defaults); `@layer components` only when ≥3 components repeat a pattern.
