import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/shared/domain/pagination';

export class BranchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Super-admin only — filter by company; omit to list across all companies' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
