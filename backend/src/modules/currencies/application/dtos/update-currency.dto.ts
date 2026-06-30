import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateCurrencyDto {
  @ApiProperty({ example: 'Dólar Estadounidense', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiProperty({ example: '$', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  symbol?: string;

  @ApiProperty({ example: 3.71, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  exchangeRate?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
