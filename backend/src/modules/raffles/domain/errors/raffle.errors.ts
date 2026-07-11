import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';
import { RaffleStatus } from '../enums/raffle-status.enum';

export class RaffleNotFoundError extends DomainError {
  constructor(id: string) {
    super('RAFFLE_NOT_FOUND', `Raffle ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class RaffleInvalidTransitionError extends DomainError {
  constructor(from: RaffleStatus, to: RaffleStatus) {
    super(
      'RAFFLE_INVALID_TRANSITION',
      `Cannot transition raffle from ${from} to ${to}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class RaffleNotOpenError extends DomainError {
  constructor() {
    super('RAFFLE_NOT_OPEN', 'Raffle must be OPEN to be drawn', HttpStatus.CONFLICT);
  }
}

export class RaffleNoEligibleParticipantsError extends DomainError {
  constructor() {
    super(
      'RAFFLE_NO_ELIGIBLE_PARTICIPANTS',
      'No active customers with points or a paid purchase were found for this raffle',
      HttpStatus.CONFLICT,
    );
  }
}

export class RaffleNotEditableError extends DomainError {
  constructor() {
    super('RAFFLE_NOT_EDITABLE', 'Only DRAFT raffles can be edited or deleted', HttpStatus.CONFLICT);
  }
}

export class RaffleNotDrawnError extends DomainError {
  constructor() {
    super(
      'RAFFLE_NOT_DRAWN',
      'Raffle must be CLOSED with a winner before tracking prize delivery',
      HttpStatus.CONFLICT,
    );
  }
}

export class RaffleInvalidDateRangeError extends DomainError {
  constructor() {
    super('RAFFLE_INVALID_DATE_RANGE', 'endsAt must be after startsAt', HttpStatus.BAD_REQUEST);
  }
}
