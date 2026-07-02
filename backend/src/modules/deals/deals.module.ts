import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealOrmEntity } from './infrastructure/persistence/deal.orm-entity';
import { DealRepository, DealRepositoryImpl } from './infrastructure/persistence/deal.repository.impl';
import { DealController } from './infrastructure/http/deal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DealOrmEntity])],
  controllers: [DealController],
  providers: [{ provide: DealRepository, useClass: DealRepositoryImpl }],
  exports: [DealRepository],
})
export class DealsModule {}
