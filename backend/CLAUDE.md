# Backend — NestJS API

Stack: NestJS + TypeORM + PostgreSQL · class-validator · @nestjs/config + Joi · JWT RS256 (passport) · Swagger · TS strict.
Release pages: https://github.com/nestjs/nest/releases · https://github.com/typeorm/typeorm/releases

> Detailed patterns (use cases, Result monad, repos, security, testing): skill `nestjs-patterns`.

## Architecture — Clean/Hexagonal
```
src/modules/<domain>/
  domain/          # pure entities, value objects, repository interfaces — zero framework imports
  application/     # use-cases/ (one class, one execute()), dtos/, mappers/
  infrastructure/  # persistence/ (TypeORM entity + repo impl), http/ (controllers)
src/shared/        # base entity, Result<T,E>, filters, interceptors, guards, pipes
src/config/        # Joi-validated env
src/database/      # migrations/ (generated), seeds/
```

## Hard Rules
- Domain entities never import NestJS/TypeORM; ORM entities never leave `infrastructure/`.
- Controllers: HTTP only — no business logic. Use cases return `Result<T,E>`.
- Migrations always; `synchronize: false` everywhere. Index FKs and WHERE/ORDER BY columns.
- Every query scoped by `tenantId`/`userId` — no unscoped `findAll()`.
- Response envelope `{ data, meta?, error? }` via interceptor; `@ApiProperty()` on every DTO field.

## Commands
`start:dev` · `build` · `migration:generate/run/revert` · `seed` · `test` · `test:e2e` · `test:cov`
