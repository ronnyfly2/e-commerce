import { DataSource } from 'typeorm';
import { CurrencyOrmEntity } from '@/modules/currencies/infrastructure/persistence/currency.orm-entity';

export const INITIAL_CURRENCIES: Omit<CurrencyOrmEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[] = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$',  exchangeRate: 1.000000, isDefault: true,  isActive: true },
  { code: 'PEN', name: 'Sol Peruano',          symbol: 'S/', exchangeRate: 3.710000, isDefault: false, isActive: true },
  { code: 'CLP', name: 'Peso Chileno',         symbol: '$',  exchangeRate: 935.0000, isDefault: false, isActive: true },
  { code: 'MXN', name: 'Peso Mexicano',        symbol: '$',  exchangeRate: 18.20000, isDefault: false, isActive: true },
];

export async function seedCurrencies(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(CurrencyOrmEntity);

  for (const data of INITIAL_CURRENCIES) {
    const existing = await repo.findOne({ where: { code: data.code } });
    if (existing) {
      console.log(`[seed] currency ${data.code} already exists — skipping`);
      continue;
    }
    await repo.save(repo.create(data));
    console.log(`[seed] currency created → ${data.code} (${data.name}) rate=${data.exchangeRate}`);
  }
}
