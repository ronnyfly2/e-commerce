import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrmEntity } from './infrastructure/persistence/customer.orm-entity';
import {
  CustomerRepository,
  CustomerRepositoryImpl,
} from './infrastructure/persistence/customer.repository.impl';
import { CustomerController } from './infrastructure/http/customer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomerController],
  providers: [{ provide: CustomerRepository, useClass: CustomerRepositoryImpl }],
  exports: [CustomerRepository],
})
export class CustomersModule {}
