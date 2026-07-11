import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PointsTransactionOrmEntity } from './points-transaction.orm-entity';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { OrderOrmEntity } from '@/modules/orders/infrastructure/persistence/order.orm-entity';
import { PointsTransactionType } from '../../domain/enums/points-transaction-type.enum';
import { PointsInsufficientBalanceError } from '../../domain/errors/points.errors';
import { CustomerNotFoundError } from '@/modules/customers/domain/errors/customer.errors';
import {
  Page,
  PaginationQueryDto,
  buildPaginationMeta,
  paginationToSkipTake,
} from '@/shared/domain/pagination';

export abstract class PointsRepository {
  abstract grantManual(
    customerId: string,
    companyId: string,
    points: number,
    reason: string,
    createdById: string,
  ): Promise<void>;
  abstract awardForOrder(em: EntityManager, order: OrderOrmEntity): Promise<void>;
  abstract reverseForOrder(em: EntityManager, order: OrderOrmEntity): Promise<void>;
  abstract deductForRaffleEntries(
    em: EntityManager,
    companyId: string,
    customerIds: string[],
    pointsEach: number,
    reason: string,
  ): Promise<void>;
  abstract getBalance(customerId: string, companyId: string): Promise<number>;
  abstract listTransactions(
    customerId: string,
    companyId: string,
    query: PaginationQueryDto,
  ): Promise<Page<PointsTransactionOrmEntity>>;
}

@Injectable()
export class PointsRepositoryImpl implements PointsRepository {
  constructor(
    @InjectRepository(PointsTransactionOrmEntity)
    private readonly txRepo: Repository<PointsTransactionOrmEntity>,
    @InjectRepository(CustomerOrmEntity)
    private readonly customerRepo: Repository<CustomerOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async grantManual(
    customerId: string,
    companyId: string,
    points: number,
    reason: string,
    createdById: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const customer = await em.findOne(CustomerOrmEntity, { where: { id: customerId, companyId } });
      if (!customer) throw new CustomerNotFoundError(customerId);
      if (customer.pointsBalance + points < 0) throw new PointsInsufficientBalanceError(customerId);

      await em.update(CustomerOrmEntity, customerId, {
        pointsBalance: customer.pointsBalance + points,
      });
      await em.save(
        PointsTransactionOrmEntity,
        em.create(PointsTransactionOrmEntity, {
          companyId,
          customerId,
          type: PointsTransactionType.MANUAL,
          points,
          reason,
          createdById,
        }),
      );
    });
  }

  async awardForOrder(em: EntityManager, order: OrderOrmEntity): Promise<void> {
    if (!order.customerId) return;

    const total = (order.items ?? []).reduce((sum, item) => sum + item.pointsAwarded, 0);
    if (total <= 0) return;

    await em.increment(CustomerOrmEntity, { id: order.customerId }, 'pointsBalance', total);
    await em.save(
      PointsTransactionOrmEntity,
      em.create(PointsTransactionOrmEntity, {
        companyId: order.companyId,
        customerId: order.customerId,
        type: PointsTransactionType.PURCHASE,
        points: total,
        reason: `Order ${order.orderNumber}`,
        orderId: order.id,
      }),
    );
  }

  async reverseForOrder(em: EntityManager, order: OrderOrmEntity): Promise<void> {
    if (!order.customerId) return;

    const total = (order.items ?? []).reduce((sum, item) => sum + item.pointsAwarded, 0);
    if (total <= 0) return;

    await em.decrement(CustomerOrmEntity, { id: order.customerId }, 'pointsBalance', total);
    await em.save(
      PointsTransactionOrmEntity,
      em.create(PointsTransactionOrmEntity, {
        companyId: order.companyId,
        customerId: order.customerId,
        type: PointsTransactionType.REVERSAL,
        points: -total,
        reason: `Reversal for order ${order.orderNumber}`,
        orderId: order.id,
      }),
    );
  }

  /** Deducts a flat entry cost from every given customer in one shot — used when a raffle draw closes. */
  async deductForRaffleEntries(
    em: EntityManager,
    companyId: string,
    customerIds: string[],
    pointsEach: number,
    reason: string,
  ): Promise<void> {
    if (pointsEach <= 0 || customerIds.length === 0) return;

    await em.decrement(CustomerOrmEntity, { id: In(customerIds) }, 'pointsBalance', pointsEach);
    await em.save(
      PointsTransactionOrmEntity,
      customerIds.map((customerId) =>
        em.create(PointsTransactionOrmEntity, {
          companyId,
          customerId,
          type: PointsTransactionType.RAFFLE_ENTRY,
          points: -pointsEach,
          reason,
        }),
      ),
    );
  }

  async getBalance(customerId: string, companyId: string): Promise<number> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId, companyId } });
    if (!customer) throw new CustomerNotFoundError(customerId);
    return customer.pointsBalance;
  }

  async listTransactions(
    customerId: string,
    companyId: string,
    query: PaginationQueryDto,
  ): Promise<Page<PointsTransactionOrmEntity>> {
    const { page = 1, limit = 20 } = query;
    const { skip, take } = paginationToSkipTake(page, limit);

    const [items, total] = await this.txRepo.findAndCount({
      where: { customerId, companyId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }
}
