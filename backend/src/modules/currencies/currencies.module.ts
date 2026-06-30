import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyOrmEntity } from './infrastructure/persistence/currency.orm-entity';
import {
  CurrencyRepository,
  CurrencyRepositoryImpl,
} from './infrastructure/persistence/currency.repository.impl';
import { CurrencyController } from './infrastructure/http/currency.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyOrmEntity])],
  controllers: [CurrencyController],
  providers: [{ provide: CurrencyRepository, useClass: CurrencyRepositoryImpl }],
  exports: [CurrencyRepository],
})
export class CurrenciesModule {}
