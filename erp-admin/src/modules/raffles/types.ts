export type RaffleStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type RafflePrizeStatus = 'PENDING' | 'DELIVERED';

export interface Raffle {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  prizeDescription: string;
  images: string[] | null;
  startsAt: string;
  endsAt: string;
  status: RaffleStatus;
  costPoints: number;
  drawAnimationSeconds: number;
  winnerCustomerId: string | null;
  winner?: { id: string; name: string; phone: string } | null;
  drawnAt: string | null;
  prizeStatus: RafflePrizeStatus;
  prizeDeliveryImageUrl: string | null;
  prizeDeliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRafflePayload {
  name: string;
  description?: string;
  prizeDescription: string;
  images?: string[];
  startsAt: string;
  endsAt: string;
  costPoints?: number;
  drawAnimationSeconds?: number;
}

export type UpdateRafflePayload = Partial<CreateRafflePayload>;

export interface UpdatePrizeStatusPayload {
  status: RafflePrizeStatus;
  imageUrl?: string;
}

export const PRIZE_STATUS_LABELS: Record<RafflePrizeStatus, string> = {
  PENDING: 'Pendiente de entrega',
  DELIVERED: 'Entregado',
};

export interface EligibleCustomer {
  id: string;
  name: string;
  phone: string;
  pointsBalance: number;
}

export interface EligiblePreview {
  count: number;
  customers: EligibleCustomer[];
}

export interface RaffleFilters {
  page?: number;
  limit?: number;
  status?: RaffleStatus;
}

export const RAFFLE_STATUS_TRANSITIONS: Record<RaffleStatus, RaffleStatus[]> = {
  DRAFT: ['OPEN'],
  OPEN: ['CLOSED'],
  CLOSED: [],
};

export const RAFFLE_STATUS_LABELS: Record<RaffleStatus, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
};
