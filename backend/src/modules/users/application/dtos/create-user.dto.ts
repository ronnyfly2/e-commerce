import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional,
  IsString, IsUUID, MaxLength, MinLength,
} from 'class-validator';
import { Permission } from '@/shared/domain/permission.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Role UUID to assign' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({
    enum: Permission,
    isArray: true,
    description: 'Extra permissions granted on top of the role',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  additionalPermissions?: Permission[];
}
