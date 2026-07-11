import {
  Column, CreateDateColumn, Entity,
  Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { RaffleOrmEntity } from './raffle.orm-entity';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';

/** Snapshot of the customers who were eligible at draw time — written once, inside RaffleRepositoryImpl.draw(). */
@Entity('raffle_entries')
@Unique(['raffleId', 'customerId'])
export class RaffleEntryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'raffle_id', type: 'uuid' })
  raffleId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => RaffleOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raffle_id' })
  raffle: RaffleOrmEntity;

  @ManyToOne(() => CustomerOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;
}
