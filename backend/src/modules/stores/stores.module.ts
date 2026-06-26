import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreOrmEntity } from './infrastructure/persistence/store.orm-entity';
import {
  StoreRepository,
  StoreRepositoryImpl,
} from './infrastructure/persistence/store.repository.impl';
import { StoreController } from './infrastructure/http/store.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StoreOrmEntity])],
  controllers: [StoreController],
  providers: [{ provide: StoreRepository, useClass: StoreRepositoryImpl }],
  exports: [StoreRepository],
})
export class StoresModule {}
