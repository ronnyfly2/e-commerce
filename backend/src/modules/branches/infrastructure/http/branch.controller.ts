import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { CompanyRepository } from '@/modules/companies/infrastructure/persistence/company.repository.impl';
import { CompanyNotFoundError } from '@/modules/companies/domain/errors/company.errors';
import { BranchRepository } from '../persistence/branch.repository.impl';
import { CreateBranchDto } from '../../application/dtos/create-branch.dto';
import { UpdateBranchDto } from '../../application/dtos/update-branch.dto';
import { BranchQueryDto } from '../../application/dtos/branch-query.dto';
import { BranchCodeConflictError, BranchNotFoundError } from '../../domain/errors/branch.errors';

@ApiBearerAuth()
@ApiTags('Branches')
@Controller('branches')
export class BranchController {
  constructor(
    private readonly branchRepo: BranchRepository,
    private readonly companyRepo: CompanyRepository,
  ) {}

  /** Super-admins may target any company via dto.companyId; everyone else is pinned to their own JWT companyId. */
  private async resolveCompanyId(user: JwtPayload, requestedCompanyId?: string): Promise<string> {
    const companyId = user.isSuperAdmin && requestedCompanyId ? requestedCompanyId : user.companyId;
    if (!companyId) throw new ForbiddenException('No company context');
    if (user.isSuperAdmin && requestedCompanyId) {
      const company = await this.companyRepo.findById(requestedCompanyId);
      if (!company) throw new CompanyNotFoundError(requestedCompanyId);
    }
    return companyId;
  }

  @Post()
  @Permissions(Permission.BRANCH_CREATE)
  async create(@Body() dto: CreateBranchDto, @CurrentUser() user: JwtPayload) {
    const { companyId: requestedCompanyId, ...rest } = dto;
    const companyId = await this.resolveCompanyId(user, requestedCompanyId);
    const existing = await this.branchRepo.findByCode(rest.code, companyId);
    if (existing) throw new BranchCodeConflictError(rest.code);
    return this.branchRepo.create({ ...rest, companyId });
  }

  @Get()
  @Permissions(Permission.BRANCH_VIEW)
  findAll(@Query() query: BranchQueryDto, @CurrentUser() user: JwtPayload) {
    const { companyId: requestedCompanyId, ...pagination } = query;
    if (user.isSuperAdmin) {
      return this.branchRepo.findAll(requestedCompanyId ?? null, pagination);
    }
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.branchRepo.findAll(user.companyId, pagination);
  }

  @Get(':id')
  @Permissions(Permission.BRANCH_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const scopeCompanyId = user.isSuperAdmin ? null : user.companyId;
    if (!user.isSuperAdmin && !scopeCompanyId) throw new ForbiddenException('No company context');
    const branch = await this.branchRepo.findById(id, scopeCompanyId);
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
    const scopeCompanyId = user.isSuperAdmin ? null : user.companyId;
    if (!user.isSuperAdmin && !scopeCompanyId) throw new ForbiddenException('No company context');
    const branch = await this.branchRepo.findById(id, scopeCompanyId);
    if (!branch) throw new BranchNotFoundError(id);

    const { companyId: requestedCompanyId, ...rest } = dto;
    const targetCompanyId = user.isSuperAdmin && requestedCompanyId ? requestedCompanyId : branch.companyId;
    if (user.isSuperAdmin && requestedCompanyId) {
      const company = await this.companyRepo.findById(requestedCompanyId);
      if (!company) throw new CompanyNotFoundError(requestedCompanyId);
    }

    if (rest.code && rest.code !== branch.code) {
      const existing = await this.branchRepo.findByCode(rest.code, targetCompanyId);
      if (existing) throw new BranchCodeConflictError(rest.code);
    }
    await this.branchRepo.update(id, { ...rest, companyId: targetCompanyId });
    return this.branchRepo.findById(id, scopeCompanyId);
  }

  @Delete(':id')
  @Permissions(Permission.BRANCH_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const scopeCompanyId = user.isSuperAdmin ? null : user.companyId;
    if (!user.isSuperAdmin && !scopeCompanyId) throw new ForbiddenException('No company context');
    const branch = await this.branchRepo.findById(id, scopeCompanyId);
    if (!branch) throw new BranchNotFoundError(id);
    await this.branchRepo.softDelete(id);
  }
}
