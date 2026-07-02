import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBundleOrmEntity } from './infrastructure/persistence/product-bundle.orm-entity';
import { ProductBundleItemOrmEntity } from './infrastructure/persistence/product-bundle-item.orm-entity';
import {
  ProductBundleRepository,
  ProductBundleRepositoryImpl,
} from './infrastructure/persistence/product-bundle.repository.impl';
import { ProductBundleController } from './infrastructure/http/product-bundle.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductBundleOrmEntity, ProductBundleItemOrmEntity])],
  controllers: [ProductBundleController],
  providers: [{ provide: ProductBundleRepository, useClass: ProductBundleRepositoryImpl }],
  exports: [ProductBundleRepository],
})
export class ProductBundlesModule {}
