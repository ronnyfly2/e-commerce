import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class ProductBundleItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
