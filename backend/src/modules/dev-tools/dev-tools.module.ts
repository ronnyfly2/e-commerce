import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyOrmEntity } from '@/modules/companies/infrastructure/persistence/company.orm-entity';
import { UserOrmEntity } from '@/modules/auth/infrastructure/persistence/user.orm-entity';
import { CurrencyOrmEntity } from '@/modules/currencies/infrastructure/persistence/currency.orm-entity';
import { RoleOrmEntity } from '@/modules/roles/infrastructure/persistence/role.orm-entity';
import { CategoryOrmEntity } from '@/modules/categories/infrastructure/persistence/category.orm-entity';
import { CustomerOrmEntity } from '@/modules/customers/infrastructure/persistence/customer.orm-entity';
import { DevToolsService } from './infrastructure/dev-tools.service';
import { DevToolsController } from './infrastructure/http/dev-tools.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyOrmEntity, UserOrmEntity, CurrencyOrmEntity, RoleOrmEntity, CategoryOrmEntity, CustomerOrmEntity,
    ]),
  ],
  controllers: [DevToolsController],
  providers: [DevToolsService],
})
export class DevToolsModule {}
