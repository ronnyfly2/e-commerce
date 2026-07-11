import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RaffleOrmEntity } from './infrastructure/persistence/raffle.orm-entity';
import { RaffleEntryOrmEntity } from './infrastructure/persistence/raffle-entry.orm-entity';
import { RaffleRepository, RaffleRepositoryImpl } from './infrastructure/persistence/raffle.repository.impl';
import { RaffleController } from './infrastructure/http/raffle.controller';
import { PointsModule } from '@/modules/points/points.module';

@Module({
  imports: [TypeOrmModule.forFeature([RaffleOrmEntity, RaffleEntryOrmEntity]), PointsModule],
  controllers: [RaffleController],
  providers: [{ provide: RaffleRepository, useClass: RaffleRepositoryImpl }],
  exports: [RaffleRepository],
})
export class RafflesModule {}
