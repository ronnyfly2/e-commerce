import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, IsUUID, Min } from 'class-validator';

export class CreateProductPriceTierDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 3, description: 'Minimum quantity to unlock this price' })
  @IsInt()
  @Min(2)
  minQuantity: number;

  @ApiProperty({ example: 45.0, description: 'Unit price when buying minQuantity or more' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  price: number;
}
