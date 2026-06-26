import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyOrmEntity } from './infrastructure/persistence/company.orm-entity';
import {
  CompanyRepository,
  CompanyRepositoryImpl,
} from './infrastructure/persistence/company.repository.impl';
import { CompanyController } from './infrastructure/http/company.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyOrmEntity])],
  controllers: [CompanyController],
  providers: [{ provide: CompanyRepository, useClass: CompanyRepositoryImpl }],
  exports: [CompanyRepository],
})
export class CompaniesModule {}
