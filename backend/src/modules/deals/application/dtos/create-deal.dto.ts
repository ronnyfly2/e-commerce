import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsPositive, IsString, IsUUID, MaxLength,
} from 'class-validator';
import { DealStage } from '../../domain/deal-stage.enum';

export class CreateDealDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'Pedido al por mayor — 50 poleras' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ enum: DealStage, default: DealStage.NEW })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @ApiPropertyOptional({ example: 450.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  value?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;
}
