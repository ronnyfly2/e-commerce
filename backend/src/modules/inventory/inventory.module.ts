import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from '@/modules/products/infrastructure/persistence/product.orm-entity';
import { ProductStockOrmEntity } from './infrastructure/persistence/product-stock.orm-entity';
import {
  ProductStockRepository,
  ProductStockRepositoryImpl,
} from './infrastructure/persistence/product-stock.repository.impl';
import { InventoryController } from './infrastructure/http/inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductStockOrmEntity, ProductOrmEntity])],
  controllers: [InventoryController],
  providers: [{ provide: ProductStockRepository, useClass: ProductStockRepositoryImpl }],
  exports: [ProductStockRepository],
})
export class InventoryModule {}
