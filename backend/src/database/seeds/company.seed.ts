import { DataSource } from 'typeorm';
import { CompanyOrmEntity } from '@/modules/companies/infrastructure/persistence/company.orm-entity';

const DEFAULT_COMPANY = {
  name: process.env.SEED_COMPANY_NAME ?? 'Mi Empresa',
  slug: process.env.SEED_COMPANY_SLUG ?? 'mi-empresa',
  ruc:  process.env.SEED_COMPANY_RUC  ?? '20000000001',
};

export async function seedDefaultCompany(ds: DataSource): Promise<string> {
  const repo = ds.getRepository(CompanyOrmEntity);

  const existing = await repo.findOne({ where: { slug: DEFAULT_COMPANY.slug } });
  if (existing) {
    console.log(`[seed] default company already exists (${existing.name}) — skipping`);
    return existing.id;
  }

  const company = repo.create({
    ...DEFAULT_COMPANY,
    email: null,
    phone: null,
    address: null,
    logoUrl: null,
    isActive: true,
  });

  const saved = await repo.save(company);
  console.log(`[seed] default company created → ${saved.name} (${saved.id})`);
  return saved.id;
}
