import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateProductFeatureDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'Material' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Cuero genuino' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
