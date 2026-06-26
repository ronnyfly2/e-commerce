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
import { BranchRepository } from '../persistence/branch.repository.impl';
import { CreateBranchDto } from '../../application/dtos/create-branch.dto';
import { UpdateBranchDto } from '../../application/dtos/update-branch.dto';
import { BranchCodeConflictError, BranchNotFoundError } from '../../domain/errors/branch.errors';

@ApiBearerAuth()
@ApiTags('Branches')
@Controller('branches')
export class BranchController {
  constructor(private readonly branchRepo: BranchRepository) {}

  @Post()
  @Permissions(Permission.BRANCH_CREATE)
  async create(@Body() dto: CreateBranchDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const existing = await this.branchRepo.findByCode(dto.code, user.companyId);
    if (existing) throw new BranchCodeConflictError(dto.code);
    return this.branchRepo.create({ ...dto, companyId: user.companyId });
  }

  @Get()
  @Permissions(Permission.BRANCH_VIEW)
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.branchRepo.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions(Permission.BRANCH_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const branch = await this.branchRepo.findById(id, user.companyId);
    if (!branch) throw new BranchNotFoundError(id);
    return branch;
  }

  @Patch(':id')
  @Permissions(Permission.BRANCH_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const branch = await this.branchRepo.findById(id, user.companyId);
    if (!branch) throw new BranchNotFoundError(id);
    if (dto.code && dto.code !== branch.code) {
      const existing = await this.branchRepo.findByCode(dto.code, user.companyId);
      if (existing) throw new BranchCodeConflictError(dto.code);
    }
    await this.branchRepo.update(id, dto);
    return this.branchRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.BRANCH_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const branch = await this.branchRepo.findById(id, user.companyId);
    if (!branch) throw new BranchNotFoundError(id);
    await this.branchRepo.softDelete(id);
  }
}
