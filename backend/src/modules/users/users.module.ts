import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '@/modules/auth/infrastructure/persistence/user.orm-entity';
import {
  StaffUserRepository,
  StaffUserRepositoryImpl,
} from './infrastructure/persistence/user.repository.impl';
import { UserController } from './infrastructure/http/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserController],
  providers: [{ provide: StaffUserRepository, useClass: StaffUserRepositoryImpl }],
  exports: [StaffUserRepository],
})
export class UsersModule {}
