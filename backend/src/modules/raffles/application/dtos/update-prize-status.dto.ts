import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RafflePrizeStatus } from '../../domain/enums/raffle-prize-status.enum';

export class UpdatePrizeStatusDto {
  @ApiProperty({ enum: RafflePrizeStatus, example: RafflePrizeStatus.DELIVERED })
  @IsEnum(RafflePrizeStatus)
  status: RafflePrizeStatus;

  @ApiPropertyOptional({ description: 'URL of the uploaded proof-of-delivery image' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
