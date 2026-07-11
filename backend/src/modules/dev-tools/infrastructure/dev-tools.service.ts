import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, QueryFailedError, Repository } from 'typeorm';
import { CompanyOrmEntity } from '@/modules/companies/infrastructure/persistence/company.orm-entity';
import { UserOrmEntity } from '@/modules/auth/infrastructure/persistence/user.orm-entity';
import { CurrencyOrmEntity } from '@/modules/currencies/infrastructure/persistence/currency.orm-entity';
import { RoleOrmEntity } from '@/modules/roles/infrastructure/persistence/role.orm-entity';
import { CategoryOrmEntity } from '@/modules/categories/infrastructure/persistence/category.orm-entity';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { seedDefaultCompany, DEFAULT_COMPANY } from '@/database/seeds/company.seed';
import { seedSuperAdmin } from '@/database/seeds/super-admin.seed';
import { seedCurrencies, INITIAL_CURRENCIES } from '@/database/seeds/currencies.seed';
import { seedRoles, ROLES } from '@/database/seeds/roles.seed';
import { seedUsers, USERS, seedUserEmail } from '@/database/seeds/users.seed';
import { seedCategories, CATEGORIES } from '@/database/seeds/categories.seed';
import { seedCustomers, CUSTOMERS } from '@/database/seeds/customers.seed';
import {
  SeedNotFoundError,
  SeedNotDeletableError,
  SeedDataInUseError,
  DatabaseWipeConfirmationError,
} from '../domain/errors/dev-tools.errors';
import { WIPE_DATABASE_CONFIRMATION_PHRASE } from '../application/dtos/wipe-database.dto';

export type SeedId = 'company' | 'super-admin' | 'currencies' | 'roles' | 'users' | 'categories' | 'customers';

/** Flattened parent + child slugs from the categories seed definition. */
const CATEGORY_SLUGS = CATEGORIES.flatMap((c) => [c.slug, ...(c.children ?? []).map((child) => child.slug)]);

export interface SeedStatus {
  id: SeedId;
  name: string;
  description: string;
  appliedCount: number;
  expectedCount: number;
  deletable: boolean;
}

const SEED_META: Record<SeedId, { name: string; description: string; deletable: boolean }> = {
  company: {
    name: 'Empresa por defecto',
    description: 'La compañía base bajo la que vive todo el resto de datos. No se puede eliminar individualmente.',
    deletable: false,
  },
  'super-admin': {
    name: 'Super administrador',
    description: 'Cuenta con acceso total a la plataforma.',
    deletable: true,
  },
  currencies: {
    name: 'Monedas',
    description: 'Catálogo inicial de monedas (USD, PEN, CLP, MXN).',
    deletable: true,
  },
  roles: {
    name: 'Roles del sistema',
    description: 'Roles predefinidos de staff (Administrador, Marketing, Vendedor, Cajero, etc.).',
    deletable: true,
  },
  users: {
    name: 'Usuarios de prueba',
    description: 'Usuarios de ejemplo distribuidos entre los roles del sistema.',
    deletable: true,
  },
  categories: {
    name: 'Categorías',
    description: 'Árbol de categorías de catálogo (Ropa, Calzado, Electrónica, Hogar, etc.).',
    deletable: true,
  },
  customers: {
    name: 'Clientes de prueba',
    description: 'Registros CRM de ejemplo con puntos iniciales.',
    deletable: true,
  },
};

function adminEmail(): string {
  return process.env.SEED_ADMIN_EMAIL ?? 'admin@erp.com';
}

@Injectable()
export class DevToolsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CompanyOrmEntity) private readonly companyRepo: Repository<CompanyOrmEntity>,
    @InjectRepository(UserOrmEntity) private readonly userRepo: Repository<UserOrmEntity>,
    @InjectRepository(CurrencyOrmEntity) private readonly currencyRepo: Repository<CurrencyOrmEntity>,
    @InjectRepository(RoleOrmEntity) private readonly roleRepo: Repository<RoleOrmEntity>,
    @InjectRepository(CategoryOrmEntity) private readonly categoryRepo: Repository<CategoryOrmEntity>,
    @InjectRepository(CustomerOrmEntity) private readonly customerRepo: Repository<CustomerOrmEntity>,
  ) {}

  async list(): Promise<SeedStatus[]> {
    const roleNames = ROLES.map((r) => r.name);
    const userEmails = USERS.map((u) => seedUserEmail(u));

    const [companyCount, adminCount, currencyCount, roleCount, userCount, categoryCount, customerCount] =
      await Promise.all([
        this.companyRepo.count({ where: { slug: DEFAULT_COMPANY.slug } }),
        this.userRepo.count({ where: { email: adminEmail() } }),
        this.currencyRepo.count({ where: { code: In(INITIAL_CURRENCIES.map((c) => c.code)) } }),
        this.roleRepo.count({ where: { name: In(roleNames), companyId: IsNull() } }),
        this.userRepo.count({ where: { email: In(userEmails) } }),
        this.categoryRepo.count({ where: { slug: In(CATEGORY_SLUGS) } }),
        this.customerRepo.count({ where: { phone: In(CUSTOMERS.map((c) => c.phone)) } }),
      ]);

    const counts: Record<SeedId, { applied: number; expected: number }> = {
      company: { applied: companyCount, expected: 1 },
      'super-admin': { applied: adminCount, expected: 1 },
      currencies: { applied: currencyCount, expected: INITIAL_CURRENCIES.length },
      roles: { applied: roleCount, expected: ROLES.length },
      users: { applied: userCount, expected: USERS.length },
      categories: { applied: categoryCount, expected: CATEGORY_SLUGS.length },
      customers: { applied: customerCount, expected: CUSTOMERS.length },
    };

    return (Object.keys(SEED_META) as SeedId[]).map((id) => ({
      id,
      ...SEED_META[id],
      appliedCount: counts[id].applied,
      expectedCount: counts[id].expected,
    }));
  }

  async runAll(): Promise<void> {
    const companyId = await seedDefaultCompany(this.dataSource);
    await seedSuperAdmin(this.dataSource, companyId);
    await seedCurrencies(this.dataSource);
    await seedRoles(this.dataSource);
    await seedCategories(this.dataSource, companyId);
    await seedCustomers(this.dataSource, companyId);
    await seedUsers(this.dataSource, companyId);
  }

  async runOne(id: string): Promise<void> {
    if (!(id in SEED_META)) throw new SeedNotFoundError(id);

    // Every seed but "company" depends on the default company existing — seedDefaultCompany
    // is idempotent, so calling it here is a no-op if it already ran.
    const companyId = await seedDefaultCompany(this.dataSource);

    switch (id as SeedId) {
      case 'company':
        return;
      case 'super-admin':
        await seedSuperAdmin(this.dataSource, companyId);
        return;
      case 'currencies':
        await seedCurrencies(this.dataSource);
        return;
      case 'roles':
        await seedRoles(this.dataSource);
        return;
      case 'users':
        await seedUsers(this.dataSource, companyId);
        return;
      case 'categories':
        await seedCategories(this.dataSource, companyId);
        return;
      case 'customers':
        await seedCustomers(this.dataSource, companyId);
        return;
    }
  }

  async deleteSeedData(id: string): Promise<void> {
    if (!(id in SEED_META)) throw new SeedNotFoundError(id);

    try {
      switch (id as SeedId) {
        case 'company':
          throw new SeedNotDeletableError(id);
        case 'super-admin':
          await this.userRepo.delete({ email: adminEmail() });
          return;
        case 'currencies':
          await this.currencyRepo.delete({ code: In(INITIAL_CURRENCIES.map((c) => c.code)) });
          return;
        case 'roles':
          await this.roleRepo.delete({ name: In(ROLES.map((r) => r.name)), companyId: IsNull() });
          return;
        case 'users':
          await this.userRepo.delete({ email: In(USERS.map((u) => seedUserEmail(u))) });
          return;
        case 'categories':
          await this.categoryRepo.delete({ slug: In(CATEGORY_SLUGS) });
          return;
        case 'customers':
          await this.customerRepo.delete({ phone: In(CUSTOMERS.map((c) => c.phone)) });
          return;
      }
    } catch (err) {
      if (err instanceof QueryFailedError && (err as unknown as { code?: string }).code === '23503') {
        throw new SeedDataInUseError(id);
      }
      throw err;
    }
  }

  /** Truncates every business table (all seeded + real data) but keeps the schema and migration history intact. */
  async wipeDatabase(confirm: string): Promise<{ truncatedTables: string[] }> {
    if (confirm !== WIPE_DATABASE_CONFIRMATION_PHRASE) {
      throw new DatabaseWipeConfirmationError();
    }

    const rows: { tablename: string }[] = await this.dataSource.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'migrations'`,
    );
    const tables = rows.map((r) => r.tablename);
    if (tables.length === 0) return { truncatedTables: [] };

    const quoted = tables.map((t) => `"${t}"`).join(', ');
    await this.dataSource.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
    return { truncatedTables: tables };
  }
}
