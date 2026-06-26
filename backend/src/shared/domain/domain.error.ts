import { HttpStatus } from '@nestjs/common';

export abstract class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
