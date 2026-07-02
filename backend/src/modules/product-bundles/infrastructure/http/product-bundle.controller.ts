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
import { ProductBundleRepository } from '../persistence/product-bundle.repository.impl';
import { CreateProductBundleDto } from '../../application/dtos/create-product-bundle.dto';
import { UpdateProductBundleDto } from '../../application/dtos/update-product-bundle.dto';
import { ProductBundleNotFoundError } from '../../domain/errors/product-bundle.errors';

@ApiBearerAuth()
@ApiTags('Product Bundles')
@Controller('product-bundles')
export class ProductBundleController {
  constructor(private readonly bundleRepo: ProductBundleRepository) {}

  @Post()
  @Permissions(Permission.PRODUCT_CREATE)
  async create(@Body() dto: CreateProductBundleDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const { items, ...rest } = dto;
    return this.bundleRepo.create({ ...rest, companyId: user.companyId }, items);
  }

  @Get()
  @Permissions(Permission.PRODUCT_VIEW)
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.bundleRepo.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions(Permission.PRODUCT_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const bundle = await this.bundleRepo.findById(id, user.companyId);
    if (!bundle) throw new ProductBundleNotFoundError(id);
    return bundle;
  }

  @Patch(':id')
  @Permissions(Permission.PRODUCT_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductBundleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const bundle = await this.bundleRepo.findById(id, user.companyId);
    if (!bundle) throw new ProductBundleNotFoundError(id);

    const { items, ...rest } = dto;
    await this.bundleRepo.update(id, rest);
    if (items) await this.bundleRepo.replaceItems(id, items);
    return this.bundleRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.PRODUCT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const bundle = await this.bundleRepo.findById(id, user.companyId);
    if (!bundle) throw new ProductBundleNotFoundError(id);
    await this.bundleRepo.softDelete(id);
  }
}
