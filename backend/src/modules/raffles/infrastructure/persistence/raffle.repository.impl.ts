import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RaffleOrmEntity } from './raffle.orm-entity';
import { RaffleEntryOrmEntity } from './raffle-entry.orm-entity';
import { CreateRaffleDto } from '../../application/dtos/create-raffle.dto';
import { UpdateRaffleDto } from '../../application/dtos/update-raffle.dto';
import { RaffleFiltersDto } from '../../application/dtos/raffle-filters.dto';
import { RaffleStatus } from '../../domain/enums/raffle-status.enum';
import { RafflePrizeStatus } from '../../domain/enums/raffle-prize-status.enum';
import { RaffleNoEligibleParticipantsError, RaffleNotOpenError } from '../../domain/errors/raffle.errors';
import { Page, buildPaginationMeta, paginationToSkipTake } from '@/shared/domain/pagination';
import { PointsRepository } from '@/modules/points/infrastructure/persistence/points.repository.impl';

export abstract class RaffleRepository {
  abstract create(dto: CreateRaffleDto, companyId: string): Promise<RaffleOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<RaffleOrmEntity | null>;
  abstract findAll(companyId: string, filters: RaffleFiltersDto): Promise<Page<RaffleOrmEntity>>;
  abstract update(id: string, dto: UpdateRaffleDto): Promise<void>;
  abstract updateStatus(id: string, status: RaffleStatus): Promise<void>;
  abstract updatePrizeStatus(id: string, status: RafflePrizeStatus, imageUrl: string | null): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
  abstract findEligibleCustomers(companyId: string, costPoints: number): Promise<EligibleCustomer[]>;
  abstract draw(raffle: RaffleOrmEntity): Promise<RaffleOrmEntity>;
}

export interface EligibleCustomer {
  id: string;
  name: string;
  phone: string;
  pointsBalance: number;
}

@Injectable()
export class RaffleRepositoryImpl implements RaffleRepository {
  constructor(
    @InjectRepository(RaffleOrmEntity)
    private readonly raffleRepo: Repository<RaffleOrmEntity>,
    @InjectRepository(RaffleEntryOrmEntity)
    private readonly entryRepo: Repository<RaffleEntryOrmEntity>,
    private readonly pointsRepo: PointsRepository,
    private readonly dataSource: DataSource,
  ) {}

  create(dto: CreateRaffleDto, companyId: string): Promise<RaffleOrmEntity> {
    return this.raffleRepo.save(
      this.raffleRepo.create({
        companyId,
        name: dto.name,
        description: dto.description ?? null,
        prizeDescription: dto.prizeDescription,
        images: dto.images ?? null,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        status: RaffleStatus.DRAFT,
        costPoints: dto.costPoints ?? 0,
        drawAnimationSeconds: dto.drawAnimationSeconds ?? 6,
      }),
    );
  }

  findById(id: string, companyId: string): Promise<RaffleOrmEntity | null> {
    return this.raffleRepo.findOne({ where: { id, companyId }, relations: { winner: true } });
  }

  async findAll(companyId: string, filters: RaffleFiltersDto): Promise<Page<RaffleOrmEntity>> {
    const { page = 1, limit = 20, status } = filters;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.raffleRepo
      .createQueryBuilder('r')
      .where('r.companyId = :companyId', { companyId })
      .orderBy('r.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (status) qb.andWhere('r.status = :status', { status });

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, dto: UpdateRaffleDto): Promise<void> {
    await this.raffleRepo.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.prizeDescription !== undefined && { prizeDescription: dto.prizeDescription }),
      ...(dto.images !== undefined && { images: dto.images }),
      ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
      ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
      ...(dto.costPoints !== undefined && { costPoints: dto.costPoints }),
      ...(dto.drawAnimationSeconds !== undefined && { drawAnimationSeconds: dto.drawAnimationSeconds }),
    });
  }

  async updateStatus(id: string, status: RaffleStatus): Promise<void> {
    await this.raffleRepo.update(id, { status });
  }

  async updatePrizeStatus(id: string, status: RafflePrizeStatus, imageUrl: string | null): Promise<void> {
    await this.raffleRepo.update(id, {
      prizeStatus: status,
      prizeDeliveryImageUrl: imageUrl,
      prizeDeliveredAt: status === RafflePrizeStatus.DELIVERED ? new Date() : null,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.raffleRepo.softDelete(id);
  }

  /** Active customers eligible for a raffle with the given entry cost: with a cost, they must hold at
   * least that many points; free raffles fall back to the general rule (holds points or has a paid order). */
  async findEligibleCustomers(companyId: string, costPoints: number): Promise<EligibleCustomer[]> {
    const rows: { id: string; name: string; phone: string; points_balance: number }[] =
      costPoints > 0
        ? await this.dataSource.query(
            `SELECT c.id, c.name, c.phone, c.points_balance FROM customers c
             WHERE c.company_id = $1 AND c.is_active = true AND c.deleted_at IS NULL
               AND c.points_balance >= $2`,
            [companyId, costPoints],
          )
        : await this.dataSource.query(
            `SELECT c.id, c.name, c.phone, c.points_balance FROM customers c
             WHERE c.company_id = $1 AND c.is_active = true AND c.deleted_at IS NULL
               AND (c.points_balance > 0 OR EXISTS (
                 SELECT 1 FROM orders o
                 WHERE o.customer_id = c.id AND o.payment_status = 'PAID' AND o.deleted_at IS NULL
               ))`,
            [companyId],
          );
    return rows.map((r) => ({ id: r.id, name: r.name, phone: r.phone, pointsBalance: r.points_balance }));
  }

  async draw(raffle: RaffleOrmEntity): Promise<RaffleOrmEntity> {
    if (raffle.status !== RaffleStatus.OPEN) throw new RaffleNotOpenError();

    return this.dataSource.transaction(async (em) => {
      const eligible = await this.findEligibleCustomers(raffle.companyId, raffle.costPoints);
      if (eligible.length === 0) throw new RaffleNoEligibleParticipantsError();
      const eligibleIds = eligible.map((c) => c.id);

      const entries = eligibleIds.map((customerId) =>
        em.create(RaffleEntryOrmEntity, { raffleId: raffle.id, customerId }),
      );
      await em
        .createQueryBuilder()
        .insert()
        .into(RaffleEntryOrmEntity)
        .values(entries)
        .orIgnore()
        .execute();

      if (raffle.costPoints > 0) {
        await this.pointsRepo.deductForRaffleEntries(
          em,
          raffle.companyId,
          eligibleIds,
          raffle.costPoints,
          `Entrada a sorteo "${raffle.name}"`,
        );
      }

      const winnerCustomerId = eligibleIds[randomInt(eligibleIds.length)];
      const drawnAt = new Date();

      await em.update(RaffleOrmEntity, raffle.id, {
        status: RaffleStatus.CLOSED,
        winnerCustomerId,
        drawnAt,
      });

      return em.findOneOrFail(RaffleOrmEntity, { where: { id: raffle.id }, relations: { winner: true } });
    });
  }
}
