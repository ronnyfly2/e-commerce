import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { PaginationQueryDto } from '@/shared/domain/pagination';
import { BrandRepository } from '../persistence/brand.repository.impl';
import { CreateBrandDto } from '../../application/dtos/create-brand.dto';
import { BrandNotFoundError, BrandSlugConflictError } from '../../domain/errors/brand.errors';

class UpdateBrandDto extends CreateBrandDto {}

@ApiBearerAuth()
@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandRepo: BrandRepository) {}

  @Post()
  @Permissions(Permission.BRAND_CREATE)
  async create(@Body() dto: CreateBrandDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const existing = await this.brandRepo.findBySlug(dto.slug, user.companyId);
    if (existing) throw new BrandSlugConflictError(dto.slug);
    return this.brandRepo.create({ ...dto, companyId: user.companyId });
  }

  @Get()
  @Permissions(Permission.BRAND_VIEW)
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.brandRepo.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions(Permission.BRAND_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const brand = await this.brandRepo.findById(id, user.companyId);
    if (!brand) throw new BrandNotFoundError(id);
    return brand;
  }

  @Patch(':id')
  @Permissions(Permission.BRAND_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<UpdateBrandDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const brand = await this.brandRepo.findById(id, user.companyId);
    if (!brand) throw new BrandNotFoundError(id);
    if (dto.slug && dto.slug !== brand.slug) {
      const conflict = await this.brandRepo.findBySlug(dto.slug, user.companyId);
      if (conflict) throw new BrandSlugConflictError(dto.slug);
    }
    await this.brandRepo.update(id, dto);
    return this.brandRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.BRAND_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const brand = await this.brandRepo.findById(id, user.companyId);
    if (!brand) throw new BrandNotFoundError(id);
    await this.brandRepo.softDelete(id);
  }
}
