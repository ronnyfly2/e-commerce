import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional,
  IsPositive, IsString, IsUUID, Matches, MaxLength, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductUnit } from '../../domain/product-unit.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Leather Wallet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'premium-leather-wallet' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers and dashes' })
  @MaxLength(255)
  slug: string;

  @ApiProperty({ example: 'WAL-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 49.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  compareAtPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  costPrice?: number;

  @ApiPropertyOptional({ default: 0, description: 'Reorder threshold — actual quantity is managed per store via /inventory' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 'Rojo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 0.5, description: 'Peso en kilogramos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ enum: ProductUnit, default: ProductUnit.UNIT })
  @IsOptional()
  @IsEnum(ProductUnit)
  unit?: ProductUnit;

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
  @IsString()
  @MaxLength(255)
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  images?: string[];

  @ApiPropertyOptional({ default: 0, description: 'Loyalty points credited per unit purchased once payment is marked PAID' })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsAwarded?: number;
}
