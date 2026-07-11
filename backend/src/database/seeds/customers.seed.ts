import { DataSource } from 'typeorm';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { CustomerSource } from '@/modules/customers/domain/customer-source.enum';
import { PointsTransactionOrmEntity } from '@/modules/points/infrastructure/persistence/points-transaction.orm-entity';
import { PointsTransactionType } from '@/modules/points/domain/enums/points-transaction-type.enum';

interface CustomerSeedDef {
  name: string;
  phone: string;
  points: number;
}

// The only representation of a "customer" in the system — no separate staff/portal account.
export const CUSTOMERS: CustomerSeedDef[] = [
  { name: 'Gabriel Paredes', phone: '+51 912 345 613', points: 150 },
  { name: 'Ariana Cusi', phone: '+51 912 345 614', points: 40 },
  { name: 'Mateo Solano', phone: '+51 912 345 615', points: 500 },
  { name: 'Melany Quiroz', phone: '+51 912 345 622', points: 0 },
  { name: 'Adrián Chuquimango', phone: '+51 912 345 623', points: 220 },
  { name: 'Zoe Villanueva', phone: '+51 912 345 624', points: 80 },
  { name: 'Ian Ccoyllo', phone: '+51 912 345 625', points: 10 },
];

export async function seedCustomers(ds: DataSource, companyId: string): Promise<void> {
  const customerRepo = ds.getRepository(CustomerOrmEntity);
  const txRepo = ds.getRepository(PointsTransactionOrmEntity);
  let created = 0;

  for (const def of CUSTOMERS) {
    const existing = await customerRepo.findOne({ where: { companyId, phone: def.phone } });
    if (existing) {
      console.log(`[seed] customer already exists (${def.phone}) — skipping`);
      continue;
    }

    const customer = await customerRepo.save(
      customerRepo.create({
        companyId,
        name: def.name,
        phone: def.phone,
        email: null,
        notes: 'Cliente de prueba (seed)',
        source: CustomerSource.MANUAL,
        isActive: true,
        pointsBalance: def.points,
      }),
    );

    if (def.points > 0) {
      await txRepo.save(
        txRepo.create({
          companyId,
          customerId: customer.id,
          type: PointsTransactionType.MANUAL,
          points: def.points,
          reason: 'Puntos de bienvenida (seed)',
        }),
      );
    }

    created += 1;
    console.log(`[seed] customer created → ${def.name} (${def.phone}) — ${def.points} pts`);
  }

  console.log(`[seed] ${created} customer(s) created`);
}
