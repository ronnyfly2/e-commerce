import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { PaginationQueryDto } from '@/shared/domain/pagination';
import { StoreRepository } from '@/modules/stores/infrastructure/persistence/store.repository.impl';
import { ProductStockRepository } from '@/modules/inventory/infrastructure/persistence/product-stock.repository.impl';
import { ProductRepository } from '../persistence/product.repository.impl';
import { CreateProductDto } from '../../application/dtos/create-product.dto';
import {
  ProductNotFoundError,
  ProductSkuConflictError,
  ProductSlugConflictError,
} from '../../domain/errors/product.errors';

class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

@ApiBearerAuth()
@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly storeRepo: StoreRepository,
    private readonly productStockRepo: ProductStockRepository,
  ) {}

  @Post()
  @Permissions(Permission.PRODUCT_CREATE)
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');

    const [existingSku, existingSlug] = await Promise.all([
      this.productRepo.findBySku(dto.sku, user.companyId),
      this.productRepo.findBySlug(dto.slug, user.companyId),
    ]);

    if (existingSku) throw new ProductSkuConflictError(dto.sku);
    if (existingSlug) throw new ProductSlugConflictError(dto.slug);

    const product = await this.productRepo.create({ ...dto, companyId: user.companyId });

    const storeIds = await this.storeRepo.findAllIds(user.companyId);
    await this.productStockRepo.createManyForProduct(product.id, user.companyId, storeIds);

    return product;
  }

  @Get()
  @Permissions(Permission.PRODUCT_VIEW)
  findAll(@Query() query: ProductQueryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.productRepo.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions(Permission.PRODUCT_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const product = await this.productRepo.findById(id, user.companyId);
    if (!product) throw new ProductNotFoundError(id);
    return product;
  }

  @Patch(':id')
  @Permissions(Permission.PRODUCT_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateProductDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const product = await this.productRepo.findById(id, user.companyId);
    if (!product) throw new ProductNotFoundError(id);

    if (dto.sku && dto.sku !== product.sku) {
      const conflict = await this.productRepo.findBySku(dto.sku, user.companyId);
      if (conflict) throw new ProductSkuConflictError(dto.sku);
    }
    if (dto.slug && dto.slug !== product.slug) {
      const conflict = await this.productRepo.findBySlug(dto.slug, user.companyId);
      if (conflict) throw new ProductSlugConflictError(dto.slug);
    }

    await this.productRepo.update(id, dto);
    return this.productRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.PRODUCT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const product = await this.productRepo.findById(id, user.companyId);
    if (!product) throw new ProductNotFoundError(id);
    await this.productRepo.softDelete(id);
  }
}
