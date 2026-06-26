import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserOrmEntity } from '@/modules/auth/infrastructure/persistence/user.orm-entity';

export async function seedSuperAdmin(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(UserOrmEntity);

  const email =
    process.env.SEED_ADMIN_EMAIL ?? 'admin@erp.com';
  const rawPassword =
    process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';

  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    console.log(`[seed] super-admin already exists (${email}) — skipping`);
    return;
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const admin = repo.create({
    email,
    passwordHash,
    firstName: 'Super',
    lastName: 'Admin',
    isActive: true,
    isSuperAdmin: true,
    companyId: null,
    roleId: null,
    phone: null,
    avatarUrl: null,
    lastLoginAt: null,
  });

  await repo.save(admin);
  console.log(`[seed] super-admin created → ${email} / ${rawPassword}`);
}
