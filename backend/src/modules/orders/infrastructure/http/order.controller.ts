import {
  Body, Controller, Delete, ForbiddenException,
  Get, HttpCode, HttpStatus, Param, ParseUUIDPipe,
  Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { OrderRepository } from '../persistence/order.repository.impl';
import { CreateOrderDto } from '../../application/dtos/create-order.dto';
import { UpdateOrderStatusDto } from '../../application/dtos/update-order-status.dto';
import { UpdatePaymentStatusDto } from '../../application/dtos/update-payment-status.dto';
import { OrderFiltersDto } from '../../application/dtos/order-filters.dto';
import {
  OrderNotFoundError, OrderInvalidTransitionError,
  OrderDeliveryAddressRequiredError, OrderItemsEmptyError,
} from '../../domain/errors/order.errors';
import { isValidTransition } from '../../domain/enums/order-status.enum';
import { DeliveryType } from '../../domain/enums/delivery-type.enum';
import { OrderStatus } from '../../domain/enums/order-status.enum';

@ApiBearerAuth()
@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderRepo: OrderRepository) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order (admin, phone, WhatsApp, or online)' })
  @Permissions(Permission.ORDER_CREATE)
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');

    if (dto.deliveryType === DeliveryType.DELIVERY && !dto.deliveryAddress) {
      throw new OrderDeliveryAddressRequiredError();
    }

    if (!dto.items?.length) {
      throw new OrderItemsEmptyError();
    }

    return this.orderRepo.create(dto, user.companyId, user.sub, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'List orders with filters' })
  @Permissions(Permission.ORDER_VIEW)
  findAll(@Query() filters: OrderFiltersDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.orderRepo.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order with items and status history' })
  @Permissions(Permission.ORDER_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const order = await this.orderRepo.findById(id, user.companyId);
    if (!order) throw new OrderNotFoundError(id);
    return order;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition order to a new status' })
  @Permissions(Permission.ORDER_UPDATE)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const order = await this.orderRepo.findById(id, user.companyId);
    if (!order) throw new OrderNotFoundError(id);
    if (!isValidTransition(order.status, dto.status)) {
      throw new OrderInvalidTransitionError(order.status, dto.status);
    }
    return this.orderRepo.updateStatus(order, dto.status, user.sub, user.email, dto.notes);
  }

  @Patch(':id/payment-status')
  @ApiOperation({ summary: 'Update the payment status of an order' })
  @Permissions(Permission.ORDER_UPDATE)
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const order = await this.orderRepo.findById(id, user.companyId);
    if (!order) throw new OrderNotFoundError(id);
    return this.orderRepo.updatePaymentStatus(order, dto.paymentStatus);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel and soft-delete an order' })
  @Permissions(Permission.ORDER_CANCEL)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const order = await this.orderRepo.findById(id, user.companyId);
    if (!order) throw new OrderNotFoundError(id);

    const cancellable: OrderStatus[] = [
      OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING,
    ];
    if (!cancellable.includes(order.status)) {
      throw new OrderInvalidTransitionError(order.status, OrderStatus.CANCELLED);
    }

    await this.orderRepo.updateStatus(
      order, OrderStatus.CANCELLED, user.sub, user.email, 'Cancelled by staff',
    );
    await this.orderRepo.softDelete(id);
  }
}
