import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductPriceTierDto } from './create-product-price-tier.dto';

export class UpdateProductPriceTierDto extends PartialType(
  OmitType(CreateProductPriceTierDto, ['productId'] as const),
) {}
