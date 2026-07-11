import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class PointsInsufficientBalanceError extends DomainError {
  constructor(customerId: string) {
    super(
      'POINTS_INSUFFICIENT_BALANCE',
      `Customer ${customerId} does not have enough points for this adjustment`,
      HttpStatus.CONFLICT,
    );
  }
}
