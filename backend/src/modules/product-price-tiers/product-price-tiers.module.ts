import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductPriceTierOrmEntity } from './infrastructure/persistence/product-price-tier.orm-entity';
import {
  ProductPriceTierRepository,
  ProductPriceTierRepositoryImpl,
} from './infrastructure/persistence/product-price-tier.repository.impl';
import { ProductPriceTierController } from './infrastructure/http/product-price-tier.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductPriceTierOrmEntity])],
  controllers: [ProductPriceTierController],
  providers: [{ provide: ProductPriceTierRepository, useClass: ProductPriceTierRepositoryImpl }],
  exports: [ProductPriceTierRepository],
})
export class ProductPriceTiersModule {}
