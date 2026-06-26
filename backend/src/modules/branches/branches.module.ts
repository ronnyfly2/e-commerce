import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchOrmEntity } from './infrastructure/persistence/branch.orm-entity';
import {
  BranchRepository,
  BranchRepositoryImpl,
} from './infrastructure/persistence/branch.repository.impl';
import { BranchController } from './infrastructure/http/branch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BranchOrmEntity])],
  controllers: [BranchController],
  providers: [{ provide: BranchRepository, useClass: BranchRepositoryImpl }],
  exports: [BranchRepository],
})
export class BranchesModule {}
