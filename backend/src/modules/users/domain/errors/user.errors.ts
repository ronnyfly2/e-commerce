import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class UserNotFoundError extends DomainError {
  constructor(id: string) {
    super('USER_NOT_FOUND', `User ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class UserEmailConflictError extends DomainError {
  constructor(email: string) {
    super('USER_EMAIL_CONFLICT', `Email "${email}" is already in use`, HttpStatus.CONFLICT);
  }
}
