import { DataSource, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserOrmEntity } from '@/modules/auth/infrastructure/persistence/user.orm-entity';
import { RoleOrmEntity } from '@/modules/roles/infrastructure/persistence/role.orm-entity';

interface UserDef {
  firstName: string;
  lastName: string;
  phone: string;
  roleName: string;
  isActive: boolean;
}

// Staff only — customers (including anyone who'd have had the old "Cliente" role) live exclusively
// in the CRM `customers` table now, see customers.seed.ts.
export const USERS: UserDef[] = [
  { firstName: 'Carlos', lastName: 'Ramírez', phone: '+51 912 345 601', roleName: 'Administrador', isActive: true },
  { firstName: 'Lucía', lastName: 'Torres', phone: '+51 912 345 602', roleName: 'Administrador', isActive: true },
  { firstName: 'Diego', lastName: 'Fernández', phone: '+51 912 345 603', roleName: 'Marketing', isActive: true },
  { firstName: 'Valentina', lastName: 'Rojas', phone: '+51 912 345 604', roleName: 'Marketing', isActive: true },
  { firstName: 'Jorge', lastName: 'Quispe', phone: '+51 912 345 605', roleName: 'Vendedor', isActive: true },
  { firstName: 'Camila', lastName: 'Huamán', phone: '+51 912 345 606', roleName: 'Vendedor', isActive: true },
  { firstName: 'Andrés', lastName: 'Mendoza', phone: '+51 912 345 607', roleName: 'Vendedor', isActive: true },
  { firstName: 'Fiorella', lastName: 'Salazar', phone: '+51 912 345 608', roleName: 'Vendedor', isActive: false },
  { firstName: 'Renzo', lastName: 'Castillo', phone: '+51 912 345 609', roleName: 'Vendedor', isActive: true },
  { firstName: 'Milagros', lastName: 'Vargas', phone: '+51 912 345 610', roleName: 'Cajero', isActive: true },
  { firstName: 'Sebastián', lastName: 'Flores', phone: '+51 912 345 611', roleName: 'Cajero', isActive: true },
  { firstName: 'Daniela', lastName: 'Chávez', phone: '+51 912 345 612', roleName: 'Cajero', isActive: false },
  { firstName: 'Ximena', lastName: 'Bravo', phone: '+51 912 345 616', roleName: 'Marketing', isActive: true },
  { firstName: 'Nicolás', lastName: 'Espinoza', phone: '+51 912 345 617', roleName: 'Vendedor', isActive: true },
  { firstName: 'Rafaella', lastName: 'Guerrero', phone: '+51 912 345 618', roleName: 'Vendedor', isActive: true },
  { firstName: 'Bruno', lastName: 'Ttito', phone: '+51 912 345 619', roleName: 'Vendedor', isActive: false },
  { firstName: 'Alessandra', lastName: 'Nina', phone: '+51 912 345 620', roleName: 'Cajero', isActive: true },
  { firstName: 'Kevin', lastName: 'Palacios', phone: '+51 912 345 621', roleName: 'Cajero', isActive: true },
];

function toEmailSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function seedUserEmail(def: Pick<UserDef, 'firstName' | 'lastName'>): string {
  return `${toEmailSlug(def.firstName)}.${toEmailSlug(def.lastName)}@erp.com`;
}

export async function seedUsers(ds: DataSource, companyId: string): Promise<void> {
  const userRepo = ds.getRepository(UserOrmEntity);
  const roleRepo = ds.getRepository(RoleOrmEntity);

  const roleIdByName = new Map<string, string>();
  for (const roleName of new Set(USERS.map((u) => u.roleName))) {
    const role = await roleRepo.findOne({ where: { name: roleName, companyId: IsNull() } });
    if (!role) {
      console.warn(`[seed] role "${roleName}" not found — skipping users assigned to it. Run seedRoles first.`);
      continue;
    }
    roleIdByName.set(roleName, role.id);
  }

  const rawPassword = process.env.SEED_USERS_PASSWORD ?? 'Demo1234!';
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  let created = 0;
  for (const def of USERS) {
    const roleId = roleIdByName.get(def.roleName);
    if (!roleId) continue;

    const email = seedUserEmail(def);

    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      console.log(`[seed] user already exists (${email}) — skipping`);
      continue;
    }

    await userRepo.save(
      userRepo.create({
        email,
        passwordHash,
        firstName: def.firstName,
        lastName: def.lastName,
        phone: def.phone,
        avatarUrl: null,
        isActive: def.isActive,
        isSuperAdmin: false,
        companyId,
        roleId,
        additionalPermissions: [],
        lastLoginAt: null,
      }),
    );
    created += 1;
    console.log(`[seed] user created → ${email} (${def.roleName})`);
  }

  console.log(`[seed] ${created} user(s) created — password for all: ${rawPassword}`);
}
