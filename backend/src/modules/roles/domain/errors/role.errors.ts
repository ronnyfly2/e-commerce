import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class RoleNotFoundError extends DomainError {
  constructor(id: string) {
    super('ROLE_NOT_FOUND', `Role ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class RoleNameConflictError extends DomainError {
  constructor(name: string) {
    super('ROLE_NAME_CONFLICT', `Role "${name}" already exists in this company`, HttpStatus.CONFLICT);
  }
}

export class SystemRoleMutationError extends DomainError {
  constructor() {
    super('SYSTEM_ROLE_IMMUTABLE', 'System roles cannot be modified or deleted', HttpStatus.FORBIDDEN);
  }
}
