---
name: api-contract
description: Use when defining backend endpoints/DTOs or typing API responses in erp-admin or frontend-client — shared response envelope, pagination, error codes, and type-sync rules across the three projects.
---

# API Contract — shared across backend, erp-admin, frontend-client

The backend is the source of truth. Frontends mirror these shapes in `shared/types/` (erp-admin) and `app/utils/types/` (frontend-client) — same names, same fields.

## Response envelope (every endpoint)
```typescript
// Success
{ data: T, meta?: Meta, timestamp: string }
// Failure
{ error: { code: string, message: string, details?: unknown }, timestamp: string }
```

## Pagination
```typescript
interface Meta { page: number; perPage: number; total: number; totalPages: number }
// Cursor-based (public catalog): meta: { nextCursor: string | null; perPage: number }
```
Query params: `?page=&perPage=` (offset) or `?cursor=&perPage=` (cursor). `perPage` max 100.

## Error codes
`SCREAMING_SNAKE`, prefixed by domain: `ORDER_NOT_FOUND`, `PRODUCT_OUT_OF_STOCK`, `AUTH_TOKEN_EXPIRED`, `PAYMENT_DECLINED`.
- Frontends switch on `error.code`, never on `message` (messages can change/translate).
- HTTP status conveys the class (400/401/403/404/409/422/500); `code` conveys the specific case.

## Conventions
- JSON fields `camelCase`; dates ISO 8601 UTC strings; money as integer minor units (`amountCents`) + `currency` (ISO 4217) — never floats.
- IDs are UUIDs (string). Enums as SCREAMING_SNAKE strings: `status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED'`.
- Versioning: prefix `/api/v1/`; breaking changes require a new version.
- When a DTO changes in backend, update the mirrored types in **both** frontends in the same PR.

## Future
When the API stabilizes, consider extracting types to an npm workspace package (`@ecommerce/contracts`) or generating clients from the Swagger spec (`openapi-typescript`) — prefer the generated route once endpoints are stable.
