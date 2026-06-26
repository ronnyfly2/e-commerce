import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class ProductNotFoundError extends DomainError {
  constructor(id: string) {
    super('PRODUCT_NOT_FOUND', `Product ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ProductSkuConflictError extends DomainError {
  constructor(sku: string) {
    super('PRODUCT_SKU_CONFLICT', `SKU "${sku}" already exists`, HttpStatus.CONFLICT);
  }
}

export class ProductSlugConflictError extends DomainError {
  constructor(slug: string) {
    super('PRODUCT_SLUG_CONFLICT', `Product slug "${slug}" already exists`, HttpStatus.CONFLICT);
  }
}
