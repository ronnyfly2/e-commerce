import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '@/shared/domain/base-orm.entity';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { RaffleStatus } from '../../domain/enums/raffle-status.enum';
import { RafflePrizeStatus } from '../../domain/enums/raffle-prize-status.enum';

@Entity('raffles')
export class RaffleOrmEntity extends BaseOrmEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'prize_description', length: 500 })
  prizeDescription: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[] | null;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'varchar', length: 20, default: RaffleStatus.DRAFT })
  status: RaffleStatus;

  /** Points required to enter — 0 means free entry (any active customer with points or a paid order qualifies). */
  @Column({ name: 'cost_points', default: 0 })
  costPoints: number;

  /** How many seconds the draw animation spins in erp-admin before revealing the winner. */
  @Column({ name: 'draw_animation_seconds', default: 6 })
  drawAnimationSeconds: number;

  @Column({ name: 'winner_customer_id', type: 'uuid', nullable: true })
  winnerCustomerId: string | null;

  @Column({ name: 'drawn_at', type: 'timestamptz', nullable: true })
  drawnAt: Date | null;

  @Column({ name: 'prize_status', type: 'varchar', length: 20, default: RafflePrizeStatus.PENDING })
  prizeStatus: RafflePrizeStatus;

  @Column({ name: 'prize_delivery_image_url', type: 'varchar', length: 255, nullable: true })
  prizeDeliveryImageUrl: string | null;

  @Column({ name: 'prize_delivered_at', type: 'timestamptz', nullable: true })
  prizeDeliveredAt: Date | null;

  @ManyToOne(() => CustomerOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_customer_id' })
  winner: CustomerOrmEntity | null;
}
