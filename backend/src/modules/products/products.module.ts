import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresModule } from '@/modules/stores/stores.module';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import {
  ProductRepository,
  ProductRepositoryImpl,
} from './infrastructure/persistence/product.repository.impl';
import { ProductController } from './infrastructure/http/product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity]), StoresModule, InventoryModule],
  controllers: [ProductController],
  providers: [{ provide: ProductRepository, useClass: ProductRepositoryImpl }],
  exports: [ProductRepository],
})
export class ProductsModule {}
