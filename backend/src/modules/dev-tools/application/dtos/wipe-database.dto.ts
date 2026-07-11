import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export const WIPE_DATABASE_CONFIRMATION_PHRASE = 'ELIMINAR TODO';

export class WipeDatabaseDto {
  @ApiProperty({
    example: WIPE_DATABASE_CONFIRMATION_PHRASE,
    description: `Must exactly equal "${WIPE_DATABASE_CONFIRMATION_PHRASE}" — a deliberate typed confirmation, not a checkbox`,
  })
  @IsString()
  @IsNotEmpty()
  confirm: string;
}
