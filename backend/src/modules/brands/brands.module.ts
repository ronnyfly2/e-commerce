import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandOrmEntity } from './infrastructure/persistence/brand.orm-entity';
import {
  BrandRepository,
  BrandRepositoryImpl,
} from './infrastructure/persistence/brand.repository.impl';
import { BrandController } from './infrastructure/http/brand.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandOrmEntity])],
  controllers: [BrandController],
  providers: [{ provide: BrandRepository, useClass: BrandRepositoryImpl }],
  exports: [BrandRepository],
})
export class BrandsModule {}
