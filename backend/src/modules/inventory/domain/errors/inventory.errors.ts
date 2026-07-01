import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class ProductStockNotFoundError extends DomainError {
  constructor(id: string) {
    super('PRODUCT_STOCK_NOT_FOUND', `Product stock ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
