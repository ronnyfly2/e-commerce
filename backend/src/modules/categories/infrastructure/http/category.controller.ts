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
import { CategoryRepository } from '../persistence/category.repository.impl';
import { CreateCategoryDto } from '../../application/dtos/create-category.dto';
import {
  CategoryNotFoundError,
  CategorySlugConflictError,
} from '../../domain/errors/category.errors';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  @Post()
  @Permissions(Permission.CATEGORY_CREATE)
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const existing = await this.categoryRepo.findBySlug(dto.slug, user.companyId);
    if (existing) throw new CategorySlugConflictError(dto.slug);
    return this.categoryRepo.create({ ...dto, companyId: user.companyId });
  }

  @Get()
  @Permissions(Permission.CATEGORY_VIEW)
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.categoryRepo.findAll(user.companyId, query);
  }

  @Get('tree')
  @Permissions(Permission.CATEGORY_VIEW)
  @ApiOperation({ summary: 'Get full category tree (roots + children)' })
  findTree(@CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.categoryRepo.findTree(user.companyId);
  }

  @Get(':id')
  @Permissions(Permission.CATEGORY_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const cat = await this.categoryRepo.findById(id, user.companyId);
    if (!cat) throw new CategoryNotFoundError(id);
    return cat;
  }

  @Patch(':id')
  @Permissions(Permission.CATEGORY_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateCategoryDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const cat = await this.categoryRepo.findById(id, user.companyId);
    if (!cat) throw new CategoryNotFoundError(id);
    if (dto.slug && dto.slug !== cat.slug) {
      const conflict = await this.categoryRepo.findBySlug(dto.slug, user.companyId);
      if (conflict) throw new CategorySlugConflictError(dto.slug);
    }
    await this.categoryRepo.update(id, dto);
    return this.categoryRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.CATEGORY_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const cat = await this.categoryRepo.findById(id, user.companyId);
    if (!cat) throw new CategoryNotFoundError(id);
    await this.categoryRepo.softDelete(id);
  }
}
