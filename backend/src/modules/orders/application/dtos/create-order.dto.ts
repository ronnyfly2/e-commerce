import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional,
  IsPositive, IsString, IsUUID, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderChannel } from '../../domain/enums/order-channel.enum';
import { DeliveryType } from '../../domain/enums/delivery-type.enum';

export class CreateOrderItemDto {
  @ApiPropertyOptional({ description: 'Product UUID from catalog (optional for custom items)' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Bundle UUID from catalog — stock is decremented per bundle component' })
  @IsOptional()
  @IsUUID()
  bundleId?: string;

  @ApiProperty({ example: 'Premium Leather Wallet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  productName: string;

  @ApiPropertyOptional({ example: 'WAL-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productSku?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 4999, description: 'Unit price in minor currency units (cents)' })
  @IsInt()
  @IsPositive()
  unitPriceCents: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: OrderChannel, example: OrderChannel.ADMIN })
  @IsEnum(OrderChannel)
  channel: OrderChannel;

  @ApiProperty({ enum: DeliveryType, example: DeliveryType.DELIVERY })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  customerEmail?: string;

  @ApiPropertyOptional({ example: '+51 999 000 111' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Notes from the customer' })
  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ApiPropertyOptional({ example: 'Av. Larco 1234' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'Miraflores' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deliveryCity?: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deliveryState?: string;

  @ApiPropertyOptional({ example: '15074' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  deliveryZip?: string;

  @ApiPropertyOptional({ example: 'Frente al parque' })
  @IsOptional()
  @IsString()
  deliveryReference?: string;

  @ApiPropertyOptional({ default: 0, description: 'Discount amount in minor currency units' })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountCents?: number;

  @ApiPropertyOptional({ default: 0, description: 'Tax amount in minor currency units' })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxCents?: number;

  @ApiPropertyOptional({ default: 0, description: 'Shipping cost in minor currency units' })
  @IsOptional()
  @IsInt()
  @Min(0)
  shippingCents?: number;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code' })
  @IsString()
  @MaxLength(3)
  currencyCode: string;

  @ApiPropertyOptional({ description: 'Internal staff notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Store fulfilling this order — required before it can be confirmed (stock is decremented from here)' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Staff member UUID to assign this order to' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
