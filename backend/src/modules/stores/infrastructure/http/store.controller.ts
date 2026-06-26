import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { PaginationQueryDto } from '@/shared/domain/pagination';
import { StoreRepository } from '../persistence/store.repository.impl';
import { CreateStoreDto } from '../../application/dtos/create-store.dto';
import { UpdateStoreDto } from '../../application/dtos/update-store.dto';
import { StoreCodeConflictError, StoreNotFoundError } from '../../domain/errors/store.errors';

@ApiBearerAuth()
@ApiTags('Stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeRepo: StoreRepository) {}

  @Post()
  @Permissions(Permission.STORE_CREATE)
  async create(@Body() dto: CreateStoreDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const existing = await this.storeRepo.findByCode(dto.code, user.companyId);
    if (existing) throw new StoreCodeConflictError(dto.code);
    return this.storeRepo.create({ ...dto, companyId: user.companyId });
  }

  @Get()
  @Permissions(Permission.STORE_VIEW)
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.storeRepo.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions(Permission.STORE_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const store = await this.storeRepo.findById(id, user.companyId);
    if (!store) throw new StoreNotFoundError(id);
    return store;
  }

  @Patch(':id')
  @Permissions(Permission.STORE_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const store = await this.storeRepo.findById(id, user.companyId);
    if (!store) throw new StoreNotFoundError(id);
    if (dto.code && dto.code !== store.code) {
      const conflict = await this.storeRepo.findByCode(dto.code, user.companyId);
      if (conflict) throw new StoreCodeConflictError(dto.code);
    }
    await this.storeRepo.update(id, dto);
    return this.storeRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.STORE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const store = await this.storeRepo.findById(id, user.companyId);
    if (!store) throw new StoreNotFoundError(id);
    await this.storeRepo.softDelete(id);
  }
}
