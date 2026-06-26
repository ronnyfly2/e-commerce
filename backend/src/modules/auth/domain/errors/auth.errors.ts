import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Email or password is incorrect', HttpStatus.UNAUTHORIZED);
  }
}

export class UserInactiveError extends DomainError {
  constructor() {
    super('USER_INACTIVE', 'This account has been deactivated', HttpStatus.FORBIDDEN);
  }
}

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired', HttpStatus.UNAUTHORIZED);
  }
}
