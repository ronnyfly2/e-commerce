import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryOrmEntity } from './infrastructure/persistence/category.orm-entity';
import {
  CategoryRepository,
  CategoryRepositoryImpl,
} from './infrastructure/persistence/category.repository.impl';
import { CategoryController } from './infrastructure/http/category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
  controllers: [CategoryController],
  providers: [{ provide: CategoryRepository, useClass: CategoryRepositoryImpl }],
  exports: [CategoryRepository],
})
export class CategoriesModule {}
