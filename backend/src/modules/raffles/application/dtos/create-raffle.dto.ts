import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class CreateRaffleDto {
  @ApiProperty({ example: 'Sorteo Día del Cliente' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Una laptop 14"' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prizeDescription: string;

  @ApiPropertyOptional({ type: [String], description: 'Promotional images for the raffle/prize' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  images?: string[];

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z' })
  @IsDateString()
  endsAt: string;

  @ApiPropertyOptional({ default: 0, example: 30, description: 'Points required to enter — 0 means free entry' })
  @IsOptional()
  @IsInt()
  @Min(0)
  costPoints?: number;

  @ApiPropertyOptional({ default: 6, example: 6, description: 'Seconds the draw animation spins in erp-admin before revealing the winner' })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(30)
  drawAnimationSeconds?: number;
}
