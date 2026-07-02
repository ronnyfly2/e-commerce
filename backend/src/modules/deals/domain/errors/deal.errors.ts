import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class DealNotFoundError extends DomainError {
  constructor(id: string) {
    super('DEAL_NOT_FOUND', `Deal ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
