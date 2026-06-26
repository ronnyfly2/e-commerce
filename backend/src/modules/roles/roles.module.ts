import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleOrmEntity } from './infrastructure/persistence/role.orm-entity';
import {
  RoleRepository,
  RoleRepositoryImpl,
} from './infrastructure/persistence/role.repository.impl';
import { RoleController } from './infrastructure/http/role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoleOrmEntity])],
  controllers: [RoleController],
  providers: [{ provide: RoleRepository, useClass: RoleRepositoryImpl }],
  exports: [RoleRepository],
})
export class RolesModule {}
