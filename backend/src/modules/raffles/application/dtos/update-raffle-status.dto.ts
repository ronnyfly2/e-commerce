import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RaffleStatus } from '../../domain/enums/raffle-status.enum';

export class UpdateRaffleStatusDto {
  @ApiProperty({ enum: RaffleStatus, example: RaffleStatus.OPEN })
  @IsEnum(RaffleStatus)
  status: RaffleStatus;
}
