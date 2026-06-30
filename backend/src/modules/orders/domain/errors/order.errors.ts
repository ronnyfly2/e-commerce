import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@/shared/domain/domain.error';
import { OrderStatus } from '../enums/order-status.enum';

export class OrderNotFoundError extends DomainError {
  constructor(id: string) {
    super('ORDER_NOT_FOUND', `Order ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class OrderInvalidTransitionError extends DomainError {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(
      'ORDER_INVALID_TRANSITION',
      `Cannot transition order from ${from} to ${to}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class OrderAlreadyCancelledError extends DomainError {
  constructor() {
    super('ORDER_ALREADY_CANCELLED', 'Order is already cancelled', HttpStatus.CONFLICT);
  }
}

export class OrderItemsEmptyError extends DomainError {
  constructor() {
    super('ORDER_ITEMS_EMPTY', 'Order must have at least one item', HttpStatus.BAD_REQUEST);
  }
}

export class OrderDeliveryAddressRequiredError extends DomainError {
  constructor() {
    super(
      'ORDER_DELIVERY_ADDRESS_REQUIRED',
      'Delivery address is required when delivery type is DELIVERY',
      HttpStatus.BAD_REQUEST,
    );
  }
}
