---
name: cross-project
description: Use when a feature, change, or bug fix touches more than one of backend/, erp-admin/, or frontend-client/ at the same time — implementation order, coordination checklist, PR strategy, and env var sync.
---

# Cross-Project Feature Guide

## Cuándo usar este skill
Cualquier tarea que requiera cambios en más de un sub-proyecto: nueva entidad con UI, cambio de contrato de API, nuevo rol/permiso, nueva variable de entorno, rediseño de auth, cambio en reglas de negocio compartidas.

Úsalo junto al skill de cada proyecto afectado:
- `cross-project` + `api-contract` → cuando cambia el contrato de la API
- `cross-project` + `nestjs-patterns` → cuando el origen del cambio es el backend
- `cross-project` + `vue-patterns` → cuando el admin consume algo nuevo
- `cross-project` + `nuxt-patterns` → cuando el storefront consume algo nuevo

---

## Orden de implementación (siempre este orden)

```
1. backend/        ← source of truth de negocio y tipos
2. api-contract    ← actualizar tipos compartidos (si aplica)
3. erp-admin/      ← admin consume el endpoint nuevo
4. frontend-client/ ← storefront consume el endpoint nuevo
```

**Nunca al revés.** Si el frontend necesita un campo que el backend no tiene, primero se añade al backend y se hace deploy (o se trabaja con mocking local), luego se consume en el front.

---

## Checklist por tipo de cambio

### Nuevo endpoint / nueva entidad
- [ ] Backend: dominio + use case + TypeORM entity + migración + controller + Swagger decorator
- [ ] api-contract: actualizar `shared/types/` en erp-admin y `app/utils/types/` en frontend-client
- [ ] erp-admin: store + api.ts + vista/componente
- [ ] frontend-client: server/api/ BFF route (Zod) + composable + página
- [ ] Ambos frontends: manejar el nuevo código de error con `error.code`, no `error.message`

### Campo nuevo en entidad existente (non-breaking)
- [ ] Backend: añadir campo en TypeORM entity + migración + DTO + Swagger
- [ ] Ambos frontends: actualizar el tipo local que espeja el DTO del backend
- [ ] Si el campo es requerido en UI: actualizar formularios en erp-admin

### Campo eliminado o renombrado (breaking)
- [ ] Crear nueva versión del endpoint (`/api/v2/`) — no modificar el existente hasta migrar ambos frontends
- [ ] Migrar erp-admin al endpoint nuevo
- [ ] Migrar frontend-client al endpoint nuevo
- [ ] Deprecar y eliminar endpoint viejo

### Nuevo rol / permiso
- [ ] Backend: añadir al enum de roles + guard de NestJS
- [ ] erp-admin: añadir a `meta.roles` en las rutas afectadas + ocultar UI para usuarios sin permiso
- [ ] frontend-client: verificar si afecta páginas de cuenta/vendedor

### Nueva variable de entorno
- [ ] Añadir al `.env.example` del sub-proyecto afectado (o de los 3 si es global)
- [ ] Añadir al schema de validación de env (`config/env.validation.ts` en backend, `nuxt.config.ts`/`vite.config.ts` en frontends)
- [ ] Documentar en el PR qué valor usar en dev/staging/prod

### Cambio en la lógica de autenticación
- [ ] Backend: flujo JWT (emisión, refresh, revocación)
- [ ] erp-admin: interceptor de Axios (re-autenticar, limpiar stores en logout)
- [ ] frontend-client: middleware de Nuxt + BFF de server routes (cookies httpOnly si aplica)
- [ ] Probar: token expirado, refresh expirado, logout desde otra pestaña

---

## PR Strategy

**Regla:** un cambio cross-project puede ir en un PR o en varios, dependiendo del riesgo.

| Situación | Estrategia |
|---|---|
| Cambio pequeño y no breaking | Un solo PR con commits por sub-proyecto |
| Cambio breaking o migracion de contrato | PR separado por sub-proyecto; backend primero y mergeado antes de abrir los de frontends |
| Feature compleja (> 1 día de trabajo) | Feature branch por sub-proyecto; PR apunta a un branch de feature común, no a main |

Título del PR cross-project: `feat(cross): <descripción>` — el scope `cross` indica que toca varios proyectos.

---

## Variables de entorno compartidas

| Variable | Backend | erp-admin | frontend-client |
|---|---|---|---|
| `API_URL` / `VITE_API_URL` / `NUXT_API_URL` | — | ✓ | ✓ (runtime config) |
| `JWT_PUBLIC_KEY` | ✓ | — | — |
| `DATABASE_URL` | ✓ | — | — |
| `REDIS_URL` | ✓ | — | — |
| `STRIPE_SECRET_KEY` | ✓ | — | — |
| `VITE_STRIPE_PUBLIC_KEY` | — | ✓ | ✓ |

Regla: prefijo `VITE_` para erp-admin (Vite), `NUXT_PUBLIC_` para valores públicos en frontend-client, sin prefijo en backend.

---

## Cómo pedir ayuda a Claude en tareas cross-project

Sé explícito sobre el alcance desde el primer mensaje:

```
"Quiero implementar [FEATURE] que toca backend y erp-admin.
Usa cross-project + nestjs-patterns + vue-patterns."
```

Ejemplo real:
> "Implementa el módulo de cupones de descuento. El backend debe validar y aplicar el descuento al total del pedido, y el erp-admin debe tener la pantalla de gestión de cupones (CRUD). Usa cross-project + api-contract + nestjs-patterns + vue-patterns."

Esto le dice a Claude exactamente qué contexto cargar, en qué orden trabajar, y que el precio/descuento debe calcularse server-side (regla de api-contract + nestjs-patterns).
