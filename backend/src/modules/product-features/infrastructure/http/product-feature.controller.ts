import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { ProductFeatureRepository } from '../persistence/product-feature.repository.impl';
import { CreateProductFeatureDto } from '../../application/dtos/create-product-feature.dto';
import { UpdateProductFeatureDto } from '../../application/dtos/update-product-feature.dto';
import { ProductFeatureNotFoundError } from '../../domain/errors/product-feature.errors';

@ApiBearerAuth()
@ApiTags('Product Features')
@Controller('product-features')
export class ProductFeatureController {
  constructor(private readonly featureRepo: ProductFeatureRepository) {}

  @Post()
  @Permissions(Permission.PRODUCT_UPDATE)
  create(@Body() dto: CreateProductFeatureDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.featureRepo.create({ ...dto, companyId: user.companyId });
  }

  @Get('products/:productId')
  @Permissions(Permission.PRODUCT_VIEW)
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.featureRepo.findByProduct(productId, user.companyId);
  }

  @Patch(':id')
  @Permissions(Permission.PRODUCT_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductFeatureDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const feature = await this.featureRepo.findById(id, user.companyId);
    if (!feature) throw new ProductFeatureNotFoundError(id);
    await this.featureRepo.update(id, dto);
    return this.featureRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.PRODUCT_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const feature = await this.featureRepo.findById(id, user.companyId);
    if (!feature) throw new ProductFeatureNotFoundError(id);
    await this.featureRepo.softDelete(id);
  }
}
