import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class ProductPriceTierNotFoundError extends DomainError {
  constructor(id: string) {
    super('PRODUCT_PRICE_TIER_NOT_FOUND', `Product price tier ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
