export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrencyPayload {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault?: boolean;
}

export interface UpdateCurrencyPayload {
  name?: string;
  symbol?: string;
  exchangeRate?: number;
  isActive?: boolean;
}
