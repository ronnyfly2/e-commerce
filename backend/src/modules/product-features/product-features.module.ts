import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductFeatureOrmEntity } from './infrastructure/persistence/product-feature.orm-entity';
import {
  ProductFeatureRepository,
  ProductFeatureRepositoryImpl,
} from './infrastructure/persistence/product-feature.repository.impl';
import { ProductFeatureController } from './infrastructure/http/product-feature.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductFeatureOrmEntity])],
  controllers: [ProductFeatureController],
  providers: [{ provide: ProductFeatureRepository, useClass: ProductFeatureRepositoryImpl }],
  exports: [ProductFeatureRepository],
})
export class ProductFeaturesModule {}
