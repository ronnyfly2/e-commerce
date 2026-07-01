import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({ example: 25, description: 'Absolute stock quantity for this store' })
  @IsInt()
  @Min(0)
  quantity: number;
}
