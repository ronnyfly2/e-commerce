import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateAutoReplyRuleDto {
  @ApiProperty({ example: 'horario', description: 'Matched as a case-insensitive substring of the incoming message' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  keyword: string;

  @ApiProperty({ example: 'Atendemos de lunes a sábado, 9am a 7pm.' })
  @IsString()
  @IsNotEmpty()
  replyText: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
