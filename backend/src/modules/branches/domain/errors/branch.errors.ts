import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class BranchNotFoundError extends DomainError {
  constructor(id: string) {
    super('BRANCH_NOT_FOUND', `Branch ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class BranchCodeConflictError extends DomainError {
  constructor(code: string) {
    super('BRANCH_CODE_CONFLICT', `Branch code "${code}" already exists`, HttpStatus.CONFLICT);
  }
}
