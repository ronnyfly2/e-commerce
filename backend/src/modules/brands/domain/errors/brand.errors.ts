import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class BrandNotFoundError extends DomainError {
  constructor(id: string) {
    super('BRAND_NOT_FOUND', `Brand ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class BrandSlugConflictError extends DomainError {
  constructor(slug: string) {
    super('BRAND_SLUG_CONFLICT', `Brand slug "${slug}" already exists`, HttpStatus.CONFLICT);
  }
}
