import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class AdjustPointsDto {
  @ApiProperty({ example: 100, description: 'Signed point delta — positive to grant, negative to deduct' })
  @IsInt()
  @Min(-1_000_000)
  points: number;

  @ApiProperty({ example: 'Compensación por reseña en redes sociales' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
