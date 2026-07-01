import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'Downtown Store' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'ST-001' })
  @IsString()
  @Matches(/^[A-Z0-9-]+$/, { message: 'code must be uppercase letters, numbers and dashes' })
  @MaxLength(20)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: -12.0464, description: 'Latitude (-90 to 90)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -77.0428, description: 'Longitude (-180 to 180)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
