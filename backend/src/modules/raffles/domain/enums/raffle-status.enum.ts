export enum RaffleStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export const RAFFLE_STATUS_TRANSITIONS: Record<RaffleStatus, RaffleStatus[]> = {
  [RaffleStatus.DRAFT]: [RaffleStatus.OPEN],
  [RaffleStatus.OPEN]: [RaffleStatus.CLOSED],
  [RaffleStatus.CLOSED]: [],
};

export function isValidRaffleTransition(from: RaffleStatus, to: RaffleStatus): boolean {
  return RAFFLE_STATUS_TRANSITIONS[from].includes(to);
}
