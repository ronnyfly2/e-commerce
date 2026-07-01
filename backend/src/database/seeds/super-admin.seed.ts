import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserOrmEntity } from '@/modules/auth/infrastructure/persistence/user.orm-entity';

export async function seedSuperAdmin(ds: DataSource, companyId: string): Promise<void> {
  const repo = ds.getRepository(UserOrmEntity);

  const email       = process.env.SEED_ADMIN_EMAIL    ?? 'admin@erp.com';
  const rawPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';

  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    if (!existing.companyId) {
      await repo.update(existing.id, { companyId });
      console.log(`[seed] super-admin companyId assigned → ${companyId}`);
    } else {
      console.log(`[seed] super-admin already exists (${email}) — skipping`);
    }
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
    companyId,
    roleId: null,
    phone: null,
    avatarUrl: null,
    lastLoginAt: null,
  });

  await repo.save(admin);
  console.log(`[seed] super-admin created → ${email} / ${rawPassword}`);
}
