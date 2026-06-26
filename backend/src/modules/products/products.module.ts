import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import {
  ProductRepository,
  ProductRepositoryImpl,
} from './infrastructure/persistence/product.repository.impl';
import { ProductController } from './infrastructure/http/product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductController],
  providers: [{ provide: ProductRepository, useClass: ProductRepositoryImpl }],
  exports: [ProductRepository],
})
export class ProductsModule {}
