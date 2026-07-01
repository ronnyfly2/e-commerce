import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductFeatureDto } from './create-product-feature.dto';

export class UpdateProductFeatureDto extends PartialType(
  OmitType(CreateProductFeatureDto, ['productId'] as const),
) {}
