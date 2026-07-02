import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class CustomerNotFoundError extends DomainError {
  constructor(id: string) {
    super('CUSTOMER_NOT_FOUND', `Customer ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class CustomerPhoneConflictError extends DomainError {
  constructor(phone: string) {
    super('CUSTOMER_PHONE_CONFLICT', `A customer with phone "${phone}" already exists`, HttpStatus.CONFLICT);
  }
}
