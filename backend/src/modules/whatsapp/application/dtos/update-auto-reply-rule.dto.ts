import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAutoReplyRuleDto } from './create-auto-reply-rule.dto';

export class UpdateAutoReplyRuleDto extends PartialType(CreateAutoReplyRuleDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
