import {
  Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { ProductStockRepository } from '../persistence/product-stock.repository.impl';
import { UpdateStockDto } from '../../application/dtos/update-stock.dto';
import { ProductStockNotFoundError } from '../../domain/errors/inventory.errors';

@ApiBearerAuth()
@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly productStockRepo: ProductStockRepository) {}

  @Get('products/:productId')
  @Permissions(Permission.INVENTORY_VIEW)
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.productStockRepo.findByProduct(productId, user.companyId);
  }

  @Patch(':id')
  @Permissions(Permission.INVENTORY_ADJUST)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const stock = await this.productStockRepo.findById(id, user.companyId);
    if (!stock) throw new ProductStockNotFoundError(id);
    await this.productStockRepo.updateQuantity(id, dto.quantity);
    return this.productStockRepo.findById(id, user.companyId);
  }
}
