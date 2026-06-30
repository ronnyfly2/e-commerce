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
      relations: { items: true, statusHistory: true },
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
      await em.update(OrderOrmEntity, order.id, {
        status: newStatus,
        ...(newStatus === OrderStatus.CONFIRMED && { confirmedAt: now }),
        ...(newStatus === OrderStatus.SHIPPED && { shippedAt: now }),
        ...(newStatus === OrderStatus.DELIVERED && { deliveredAt: now }),
        ...(newStatus === OrderStatus.CANCELLED && { cancelledAt: now }),
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

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<void> {
    await this.orderRepo.update(id, { paymentStatus });
  }

  async softDelete(id: string): Promise<void> {
    await this.orderRepo.softDelete(id);
  }

  private async findByIdUnscoped(id: string, em: EntityManager): Promise<OrderOrmEntity> {
    return em.findOneOrFail(OrderOrmEntity, {
      where: { id },
      relations: { items: true, statusHistory: true },
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
