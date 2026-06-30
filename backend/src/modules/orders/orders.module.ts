import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderOrmEntity } from './infrastructure/persistence/order.orm-entity';
import { OrderItemOrmEntity } from './infrastructure/persistence/order-item.orm-entity';
import { OrderStatusHistoryOrmEntity } from './infrastructure/persistence/order-status-history.orm-entity';
import { OrderRepository, OrderRepositoryImpl } from './infrastructure/persistence/order.repository.impl';
import { OrderController } from './infrastructure/http/order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity, OrderStatusHistoryOrmEntity]),
  ],
  controllers: [OrderController],
  providers: [{ provide: OrderRepository, useClass: OrderRepositoryImpl }],
  exports: [OrderRepository],
})
export class OrdersModule {}
