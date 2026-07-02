import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { OrderOrmEntity } from './order.orm-entity';
import { OrderItemOrmEntity } from './order-item.orm-entity';
import { OrderStatusHistoryOrmEntity } from './order-status-history.orm-entity';
import { CreateOrderDto } from '../../application/dtos/create-order.dto';
import { OrderFiltersDto } from '../../application/dtos/order-filters.dto';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { DeliveryType } from '../../domain/enums/delivery-type.enum';
import { OrderMissingStoreError, InsufficientStockError } from '../../domain/errors/order.errors';
import { Page, buildPaginationMeta, paginationToSkipTake } from '@/shared/domain/pagination';

export abstract class OrderRepository {
  abstract create(
    dto: CreateOrderDto,
    companyId: string,
    createdById: string,
    createdByName: string,
  ): Promise<OrderOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<OrderOrmEntity | null>;
  abstract findByNumber(orderNumber: string, companyId: string): Promise<OrderOrmEntity | null>;
  abstract findAll(companyId: string, filters: OrderFiltersDto): Promise<Page<OrderOrmEntity>>;
  abstract updateStatus(
    order: OrderOrmEntity,
    newStatus: OrderStatus,
    changedById: string,
    changedByName: string,
    notes?: string,
  ): Promise<OrderOrmEntity>;
  abstract updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly orderRepo: Repository<OrderOrmEntity>,
    @InjectRepository(OrderItemOrmEntity)
    private readonly itemRepo: Repository<OrderItemOrmEntity>,
    @InjectRepository(OrderStatusHistoryOrmEntity)
    private readonly historyRepo: Repository<OrderStatusHistoryOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateOrderDto,
    companyId: string,
    createdById: string,
    createdByName: string,
  ): Promise<OrderOrmEntity> {
    return this.dataSource.transaction(async (em) => {
      const subtotalCents = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceCents,
        0,
      );
      const discountCents = dto.discountCents ?? 0;
      const taxCents = dto.taxCents ?? 0;
      const shippingCents = dto.shippingCents ?? 0;
      const totalCents = subtotalCents - discountCents + taxCents + shippingCents;

      const orderNumber = this.generateOrderNumber();

      const order = em.create(OrderOrmEntity, {
        companyId,
        branchId: dto.branchId ?? null,
        storeId: dto.storeId ?? null,
        stockDecremented: false,
        orderNumber,
        channel: dto.channel,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        deliveryType: dto.deliveryType,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail ?? null,
        customerPhone: dto.customerPhone ?? null,
        customerNotes: dto.customerNotes ?? null,
        deliveryAddress: dto.deliveryType === DeliveryType.DELIVERY ? (dto.deliveryAddress ?? null) : null,
        deliveryCity: dto.deliveryCity ?? null,
        deliveryState: dto.deliveryState ?? null,
        deliveryZip: dto.deliveryZip ?? null,
        deliveryReference: dto.deliveryReference ?? null,
        subtotalCents,
        discountCents,
        taxCents,
        shippingCents,
        totalCents,
        currencyCode: dto.currencyCode.toUpperCase(),
        notes: dto.notes ?? null,
        assignedToId: dto.assignedToId ?? null,
        confirmedAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
      });

      const saved = await em.save(OrderOrmEntity, order);

      const items = dto.items.map((item) =>
        em.create(OrderItemOrmEntity, {
          orderId: saved.id,
          productId: item.productId ?? null,
          bundleId: item.bundleId ?? null,
          productName: item.productName,
          productSku: item.productSku ?? null,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalPriceCents: item.quantity * item.unitPriceCents,
          notes: item.notes ?? null,
        }),
      );
      await em.save(OrderItemOrmEntity, items);

      const history = em.create(OrderStatusHistoryOrmEntity, {
        orderId: saved.id,
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedById: createdById,
        changedByName: createdByName,
        notes: `Order created via ${dto.channel}`,
      });
      await em.save(OrderStatusHistoryOrmEntity, history);

      return this.findByIdUnscoped(saved.id, em);
    });
  }

  findById(id: string, companyId: string): Promise<OrderOrmEntity | null> {
    return this.orderRepo.findOne({
      where: { id, companyId },
      relations: { items: true, statusHistory: true, store: true },
      order: { statusHistory: { createdAt: 'ASC' } },
    });
  }

  findByNumber(orderNumber: string, companyId: string): Promise<OrderOrmEntity | null> {
    return this.orderRepo.findOne({ where: { orderNumber, companyId } });
  }

  async findAll(companyId: string, filters: OrderFiltersDto): Promise<Page<OrderOrmEntity>> {
    const { page = 1, limit = 20, search, status, channel, paymentStatus, branchId, dateFrom, dateTo } = filters;
    const { skip, take } = paginationToSkipTake(page, limit);

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'item')
      .where('o.companyId = :companyId', { companyId })
      .orderBy('o.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (search) {
      qb.andWhere(
        '(o.orderNumber ILIKE :s OR o.customerName ILIKE :s OR o.customerPhone ILIKE :s OR o.customerEmail ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (status) qb.andWhere('o.status = :status', { status });
    if (channel) qb.andWhere('o.channel = :channel', { channel });
    if (paymentStatus) qb.andWhere('o.paymentStatus = :paymentStatus', { paymentStatus });
    if (branchId) qb.andWhere('o.branchId = :branchId', { branchId });
    if (dateFrom) qb.andWhere('o.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('o.createdAt <= :dateTo', { dateTo: end });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async updateStatus(
    order: OrderOrmEntity,
    newStatus: OrderStatus,
    changedById: string,
    changedByName: string,
    notes?: string,
  ): Promise<OrderOrmEntity> {
    return this.dataSource.transaction(async (em) => {
      const now = new Date();

      if (newStatus === OrderStatus.CONFIRMED && !order.stockDecremented) {
        await this.decrementStock(em, order);
      } else if (newStatus === OrderStatus.CANCELLED && order.stockDecremented) {
        await this.restoreStock(em, order);
      }

      await em.update(OrderOrmEntity, order.id, {
        status: newStatus,
        ...(newStatus === OrderStatus.CONFIRMED && { confirmedAt: now, stockDecremented: true }),
        ...(newStatus === OrderStatus.SHIPPED && { shippedAt: now }),
        ...(newStatus === OrderStatus.DELIVERED && { deliveredAt: now }),
        ...(newStatus === OrderStatus.CANCELLED && { cancelledAt: now, stockDecremented: false }),
      });

      const history = em.create(OrderStatusHistoryOrmEntity, {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: newStatus,
        changedById,
        changedByName,
        notes: notes ?? null,
      });
      await em.save(OrderStatusHistoryOrmEntity, history);

      return this.findByIdUnscoped(order.id, em);
    });
  }

  /** Decrements per-store stock for every line item, expanding bundle purchases into their component products.
   * Runs inside the caller's transaction — if any product lacks stock, the whole status change rolls back. */
  private async decrementStock(em: EntityManager, order: OrderOrmEntity): Promise<void> {
    if (!order.storeId) throw new OrderMissingStoreError();

    const deltas = await this.resolveStockDeltas(em, order.items);
    for (const [productId, qty] of deltas) {
      const rows = await em.query(
        `UPDATE product_stocks SET quantity = quantity - $1
         WHERE product_id = $2 AND store_id = $3 AND quantity >= $1
         RETURNING id`,
        [qty, productId, order.storeId],
      );
      if (rows.length === 0) throw new InsufficientStockError(productId);
      await this.syncProductStock(em, productId);
    }
  }

  /** Reverses decrementStock — used when a confirmed order is cancelled. */
  private async restoreStock(em: EntityManager, order: OrderOrmEntity): Promise<void> {
    if (!order.storeId) return;

    const deltas = await this.resolveStockDeltas(em, order.items);
    for (const [productId, qty] of deltas) {
      await em.query(
        `UPDATE product_stocks SET quantity = quantity + $1 WHERE product_id = $2 AND store_id = $3`,
        [qty, productId, order.storeId],
      );
      await this.syncProductStock(em, productId);
    }
  }

  /** Maps order items to a productId → total quantity delta, expanding bundle lines into their components. */
  private async resolveStockDeltas(
    em: EntityManager,
    items: OrderItemOrmEntity[],
  ): Promise<Map<string, number>> {
    const deltas = new Map<string, number>();
    const bundleIds = [...new Set(items.filter((i) => i.bundleId).map((i) => i.bundleId as string))];
    const componentsByBundle = new Map<string, { productId: string; quantity: number }[]>();

    if (bundleIds.length > 0) {
      const rows: { bundle_id: string; product_id: string; quantity: number }[] = await em.query(
        'SELECT bundle_id, product_id, quantity FROM product_bundle_items WHERE bundle_id = ANY($1) AND deleted_at IS NULL',
        [bundleIds],
      );
      for (const row of rows) {
        const list = componentsByBundle.get(row.bundle_id) ?? [];
        list.push({ productId: row.product_id, quantity: row.quantity });
        componentsByBundle.set(row.bundle_id, list);
      }
    }

    for (const item of items) {
      if (item.bundleId) {
        for (const c of componentsByBundle.get(item.bundleId) ?? []) {
          deltas.set(c.productId, (deltas.get(c.productId) ?? 0) + c.quantity * item.quantity);
        }
      } else if (item.productId) {
        deltas.set(item.productId, (deltas.get(item.productId) ?? 0) + item.quantity);
      }
    }

    return deltas;
  }

  /** product.stock is a denormalized cache of SUM(product_stocks.quantity) — see inventory module. */
  private async syncProductStock(em: EntityManager, productId: string): Promise<void> {
    await em.query(
      `UPDATE products SET stock = (SELECT COALESCE(SUM(quantity), 0) FROM product_stocks WHERE product_id = $1)
       WHERE id = $1`,
      [productId],
    );
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<void> {
    await this.orderRepo.update(id, { paymentStatus });
  }

  async softDelete(id: string): Promise<void> {
    await this.orderRepo.softDelete(id);
  }

  private async findByIdUnscoped(id: string, em: EntityManager): Promise<OrderOrmEntity> {
    return em.findOneOrFail(OrderOrmEntity, {
      where: { id },
      relations: { items: true, statusHistory: true, store: true },
      order: { statusHistory: { createdAt: 'ASC' } },
    });
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${date}-${suffix}`;
  }
}
