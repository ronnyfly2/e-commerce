import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DealStage } from '../../domain/deal-stage.enum';

export class UpdateDealStageDto {
  @ApiProperty({ enum: DealStage })
  @IsEnum(DealStage)
  stage: DealStage;
}
