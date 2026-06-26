---
name: vue-patterns
description: Use when writing or reviewing code in erp-admin/ — Vue 3.5+ components, Pinia stores, Axios layer, VeeValidate forms, router guards, a11y, list performance.
---

# Vue 3.5+ Admin Patterns

Target: **Vue ≥ 3.5**, **pnpm** as package manager. Check latest stable at https://github.com/vuejs/core/releases before installing.

## Package Manager — pnpm (always)
```bash
pnpm add <pkg>           # runtime dependency
pnpm add -D <pkg>        # dev dependency
pnpm remove <pkg>
pnpm install             # restore lockfile
pnpm run dev / build / type-check / lint / lint:fix / test
```
Never use `npm` or `yarn` in this project. Commit `pnpm-lock.yaml`; never commit `package-lock.json`.

## Vue 3.5 Key Changes

### Reactive props destructuring (3.5+)
`defineProps` destructuring is now reactive — no `toRefs` needed:
```typescript
// ✅ Vue 3.5 — destructured props are reactive
const { count, label = 'default' } = defineProps<{ count: number; label?: string }>();
```

### useTemplateRef (3.5+)
Replaces the old `ref<HTMLElement | null>(null)` + `:ref="'name'"` pattern:
```typescript
const inputEl = useTemplateRef<HTMLInputElement>('input');
// template: <input ref="input" />
```

### useId (3.5+)
Generates stable, SSR-safe unique IDs for form labels and a11y:
```typescript
const id = useId(); // 'v-0', 'v-1', …  stable across renders
// <label :for="id">Name</label><input :id="id" />
```

### onWatcherCleanup (3.5+)
Register cleanup inside a watcher without the `(value, _, onCleanup)` signature:
```typescript
watch(searchTerm, () => {
  const controller = new AbortController();
  fetch(`/api/search?q=${searchTerm.value}`, { signal: controller.signal });
  onWatcherCleanup(() => controller.abort());
});
```

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
State exported as `readonly()`; complex logic in composables, actions stay thin; call `$reset()` on logout.

## API Layer
```typescript
// api/client.ts
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });
client.interceptors.request.use(attachAccessToken);
client.interceptors.response.use(identity, handleRefreshOrLogout); // 401→refresh→retry→logout
```
One typed function per endpoint in the module's `api.ts`. Components/stores never call axios directly.

## Components
- Emits typed with object syntax: `defineEmits<{ 'update:modelValue': [v: string] }>()` (3.3+ shorthand).
- Props: destructure directly (`const { foo = 'bar' } = defineProps<Props>()`); use `withDefaults` only for complex defaults.
- `defineExpose` only when a parent truly needs imperative access.
- No `v-html`; if unavoidable, DOMPurify first.

## Forms
VeeValidate `useForm` + Zod schema via `toTypedSchema`. Validate on blur, per-field errors, disable submit while `isSubmitting`, on success invalidate store data + toast.

## Router Guards
- `guards.ts` beforeEach: redirect unauthenticated unless `meta.public`; check `meta.permissions`.
- Dirty-form: warn before leaving unsaved forms (`onBeforeRouteLeave`).

## Async View States
```
loading → skeleton/spinner · error → message + retry · empty → illustration + CTA
```

## Performance

### Directive selection
- `v-if` — adds/removes DOM; use when the condition is rarely true or on page-load guards.
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
- Run `rollup-plugin-visualizer` (`pnpm add -D rollup-plugin-visualizer`) to audit bundle composition; check **brotli** size, not raw size.
- Tree-shake icon libraries — import individual icons, never the full set.
- Audit and uninstall unused dependencies before each release.

## A11y (WCAG AA)
Keyboard-navigable with visible focus; `alt` on images, `aria-label` on icon buttons; modals trap focus, Escape closes, focus returns on close; AA contrast. Use `useId()` to link `<label>` and `<input>` elements safely.

## Tailwind
Extend theme in `tailwind.config.ts` (never override defaults); `@layer components` only when ≥3 components repeat a pattern.
