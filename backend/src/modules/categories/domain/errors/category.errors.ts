import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class CategoryNotFoundError extends DomainError {
  constructor(id: string) {
    super('CATEGORY_NOT_FOUND', `Category ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class CategorySlugConflictError extends DomainError {
  constructor(slug: string) {
    super('CATEGORY_SLUG_CONFLICT', `Category slug "${slug}" already exists`, HttpStatus.CONFLICT);
  }
}
