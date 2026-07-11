export type SeedId = 'company' | 'super-admin' | 'currencies' | 'roles' | 'users' | 'categories' | 'customers';

export interface SeedStatus {
  id: SeedId;
  name: string;
  description: string;
  appliedCount: number;
  expectedCount: number;
  deletable: boolean;
}

export const WIPE_DATABASE_CONFIRMATION_PHRASE = 'ELIMINAR TODO';

export function seedStatusLabel(seed: SeedStatus): 'Aplicado' | 'Parcial' | 'No aplicado' {
  if (seed.appliedCount >= seed.expectedCount && seed.expectedCount > 0) return 'Aplicado';
  if (seed.appliedCount > 0) return 'Parcial';
  return 'No aplicado';
}
