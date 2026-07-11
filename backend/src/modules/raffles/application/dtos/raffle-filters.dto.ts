import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/shared/domain/pagination';
import { RaffleStatus } from '../../domain/enums/raffle-status.enum';

export class RaffleFiltersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RaffleStatus })
  @IsOptional()
  @IsEnum(RaffleStatus)
  status?: RaffleStatus;
}
