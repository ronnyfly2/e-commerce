import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class CurrencyNotFoundError extends DomainError {
  constructor(id: string) {
    super('CURRENCY_NOT_FOUND', `Currency ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class CurrencyCodeConflictError extends DomainError {
  constructor(code: string) {
    super('CURRENCY_CODE_CONFLICT', `Currency code "${code}" is already registered`, HttpStatus.CONFLICT);
  }
}

export class DefaultCurrencyCannotBeDeactivatedError extends DomainError {
  constructor() {
    super('CURRENCY_DEFAULT_DEACTIVATE', 'The default currency cannot be deactivated', HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
