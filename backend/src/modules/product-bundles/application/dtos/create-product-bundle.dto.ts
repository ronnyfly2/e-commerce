import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional,
  IsPositive, IsString, MaxLength, ValidateNested,
} from 'class-validator';
import { ProductBundleItemDto } from './product-bundle-item.dto';

export class CreateProductBundleDto {
  @ApiProperty({ example: 'Pack 3 poleras' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 89.9, description: 'Fixed price for the whole bundle' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageUrl?: string;

  @ApiProperty({ type: [ProductBundleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductBundleItemDto)
  items: ProductBundleItemDto[];
}
