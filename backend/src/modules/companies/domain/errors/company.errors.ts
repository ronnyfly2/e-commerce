import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class CompanyNotFoundError extends DomainError {
  constructor(id: string) {
    super('COMPANY_NOT_FOUND', `Company ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class CompanySlugConflictError extends DomainError {
  constructor(slug: string) {
    super('COMPANY_SLUG_CONFLICT', `Slug "${slug}" is already in use`, HttpStatus.CONFLICT);
  }
}

export class CompanyRucConflictError extends DomainError {
  constructor(ruc: string) {
    super('COMPANY_RUC_CONFLICT', `RUC "${ruc}" is already registered`, HttpStatus.CONFLICT);
  }
}
