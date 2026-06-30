import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USD', description: 'ISO 4217 code (3 chars)' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 3)
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  code: string;

  @ApiProperty({ example: 'Dólar Estadounidense' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: '$' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  symbol: string;

  @ApiProperty({ example: 1.0, description: 'Exchange rate relative to USD' })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  exchangeRate: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
