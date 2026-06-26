---
name: nestjs-patterns
description: Use when writing or reviewing backend code in backend/ — NestJS use cases, repositories, Result monad, TypeORM, auth, error handling, testing strategy.
---

# NestJS Backend Patterns

## Use Case
```typescript
// application/use-cases/create-order.use-case.ts
@Injectable()
export class CreateOrderUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(dto: CreateOrderDto): Promise<Result<Order, DomainError>> {
    const order = Order.create(dto);
    if (order.isFailure()) return order;
    return this.orderRepo.save(order.value);
  }
}
```
One class, one `execute()`, one responsibility. DTOs live in `application/`.

## Repository
Interface in domain as abstract class (doubles as DI token — no `I` prefix):
```typescript
// domain/repository.interface.ts
export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract save(order: Order): Promise<Result<Order, DomainError>>;
  abstract findByCustomer(customerId: string, p: Pagination): Promise<Page<Order>>;
}
```
Implementation in `infrastructure/persistence/` maps TypeORM entity ↔ domain entity.

## Errors
Domain/application layers return `Result<T, E>` — no throwing. At the edge:
```typescript
export class OrderNotFoundError extends DomainError {
  constructor(id: string) {
    super('ORDER_NOT_FOUND', `Order ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
```
Global exception filter maps `DomainError` → `{ error: { code, message }, timestamp }`.

## Security
- JWT RS256 asymmetric; refresh token rotation with reuse detection; logout invalidates server-side.
- `ThrottlerGuard` on public endpoints; `helmet()` + `cors()` in `main.ts`.
- bcrypt cost ≥ 12; `sanitize-html` on user-generated HTML.
- Never log passwords/tokens/PII beyond user ID. Errors never leak stack/SQL/paths.

## E-commerce critical rules
- Prices and totals computed server-side — never trust client-sent amounts.
- Stock checked **inside the order-creation transaction** (race conditions).
- Payment webhooks: verify signature before processing; handlers idempotent (dedupe by event ID).
- File uploads: whitelist MIME + extension, size limit, object storage, randomized filenames.
For generic pre-merge review use the built-in `/security-review` command.

## Database
- `migration:generate` and review before running; never hand-edit generated migrations.
- Soft deletes via `@DeleteDateColumn()` for user-facing data.
- Multi-step writes inside `dataSource.transaction()`.
- `select` only needed columns; batch inserts with `insert()` + chunks.
- Heavy reads: TypeORM query cache. Heavy jobs (emails, exports): `@nestjs/bull` + Redis.

## Pagination
Cursor-based for public/large datasets; offset for admin tables. Return via `meta` in envelope.

## Testing
| Layer | Tool | Focus |
|---|---|---|
| Domain entities | Jest | invariants, business rules |
| Use cases | Jest | orchestration with mocked repo |
| Controllers | Supertest | HTTP contract, status codes |
| Repositories | Jest + testcontainers | real queries |
| E2E | Supertest | request → DB → response |

Mock external deps; never mock domain logic. Log slow queries (> 500ms).
