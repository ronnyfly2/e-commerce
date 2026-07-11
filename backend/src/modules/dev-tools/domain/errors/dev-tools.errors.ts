import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class SeedNotFoundError extends DomainError {
  constructor(id: string) {
    super('SEED_NOT_FOUND', `Unknown seed "${id}"`, HttpStatus.NOT_FOUND);
  }
}

export class SeedNotDeletableError extends DomainError {
  constructor(id: string) {
    super(
      'SEED_NOT_DELETABLE',
      `Seed "${id}" cannot be deleted individually — it is foundational and cascades to most other data`,
      HttpStatus.CONFLICT,
    );
  }
}

export class SeedDataInUseError extends DomainError {
  constructor(id: string) {
    super(
      'SEED_DATA_IN_USE',
      `Cannot delete seed "${id}" data — other records still reference it (e.g. users assigned to a seeded role)`,
      HttpStatus.CONFLICT,
    );
  }
}

export class DatabaseWipeConfirmationError extends DomainError {
  constructor() {
    super(
      'DATABASE_WIPE_CONFIRMATION_MISMATCH',
      'Confirmation phrase does not match — database was not touched',
      HttpStatus.BAD_REQUEST,
    );
  }
}
