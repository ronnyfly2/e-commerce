import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsTransactionOrmEntity } from './infrastructure/persistence/points-transaction.orm-entity';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { PointsRepository, PointsRepositoryImpl } from './infrastructure/persistence/points.repository.impl';
import { PointsController } from './infrastructure/http/points.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PointsTransactionOrmEntity, CustomerOrmEntity])],
  controllers: [PointsController],
  providers: [{ provide: PointsRepository, useClass: PointsRepositoryImpl }],
  exports: [PointsRepository],
})
export class PointsModule {}
