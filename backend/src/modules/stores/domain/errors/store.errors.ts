import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class StoreNotFoundError extends DomainError {
  constructor(id: string) {
    super('STORE_NOT_FOUND', `Store ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class StoreCodeConflictError extends DomainError {
  constructor(code: string) {
    super('STORE_CODE_CONFLICT', `Store code "${code}" already exists`, HttpStatus.CONFLICT);
  }
}
