import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { ProductPriceTierRepository } from '../persistence/product-price-tier.repository.impl';
import { CreateProductPriceTierDto } from '../../application/dtos/create-product-price-tier.dto';
import { UpdateProductPriceTierDto } from '../../application/dtos/update-product-price-tier.dto';
import { ProductPriceTierNotFoundError } from '../../domain/errors/product-price-tier.errors';

@ApiBearerAuth()
@ApiTags('Product Price Tiers')
@Controller('product-price-tiers')
export class ProductPriceTierController {
  constructor(private readonly tierRepo: ProductPriceTierRepository) {}

  @Post()
  @Permissions(Permission.PRODUCT_UPDATE)
  create(@Body() dto: CreateProductPriceTierDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.tierRepo.create({ ...dto, companyId: user.companyId });
  }

  @Get('products/:productId')
  @Permissions(Permission.PRODUCT_VIEW)
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.tierRepo.findByProduct(productId, user.companyId);
  }

  @Patch(':id')
  @Permissions(Permission.PRODUCT_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductPriceTierDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const tier = await this.tierRepo.findById(id, user.companyId);
    if (!tier) throw new ProductPriceTierNotFoundError(id);
    await this.tierRepo.update(id, dto);
    return this.tierRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.PRODUCT_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const tier = await this.tierRepo.findById(id, user.companyId);
    if (!tier) throw new ProductPriceTierNotFoundError(id);
    await this.tierRepo.softDelete(id);
  }
}
