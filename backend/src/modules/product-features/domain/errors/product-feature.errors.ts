import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class ProductFeatureNotFoundError extends DomainError {
  constructor(id: string) {
    super('PRODUCT_FEATURE_NOT_FOUND', `Product feature ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
