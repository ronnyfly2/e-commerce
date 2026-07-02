import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendWhatsAppMessageDto {
  @ApiProperty({ example: 'Hola, tu pedido ya está listo para recoger.' })
  @IsString()
  @IsNotEmpty()
  body: string;
}
