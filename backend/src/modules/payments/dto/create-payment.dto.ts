import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID de la reserva',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  bookingId: string;

  @ApiProperty({
    description: 'Método de pago',
    enum: PaymentMethod,
    default: PaymentMethod.MERCADOPAGO,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod = PaymentMethod.MERCADOPAGO;

  @ApiPropertyOptional({
    description: 'Datos adicionales del método de pago',
  })
  @IsOptional()
  methodDetails?: Record<string, any>;
}
