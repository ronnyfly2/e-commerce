import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AppDataSource } from '../data-source';
import { seedDefaultCompany } from './company.seed';
import { seedSuperAdmin } from './super-admin.seed';
import { seedCurrencies } from './currencies.seed';
import { seedRoles } from './roles.seed';
import { seedUsers } from './users.seed';
import { seedCategories } from './categories.seed';
import { seedCustomers } from './customers.seed';

dotenv.config();

async function run(): Promise<void> {
  await AppDataSource.initialize();
  console.log('[seed] DB connected');

  try {
    const companyId = await seedDefaultCompany(AppDataSource);
    await seedSuperAdmin(AppDataSource, companyId);
    await seedCurrencies(AppDataSource);
    await seedRoles(AppDataSource);
    await seedCategories(AppDataSource, companyId);
    await seedCustomers(AppDataSource, companyId);
    await seedUsers(AppDataSource, companyId);
    console.log('[seed] done');
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
