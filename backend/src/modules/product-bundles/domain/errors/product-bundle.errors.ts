import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class ProductBundleNotFoundError extends DomainError {
  constructor(id: string) {
    super('PRODUCT_BUNDLE_NOT_FOUND', `Product bundle ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
