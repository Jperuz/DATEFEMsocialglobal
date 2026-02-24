import { IsString, MinLength, IsEnum, IsUUID, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType, Vertical } from '@prisma/client';

export class CreatePromotionDto {
  @ApiProperty({ description: 'Título de la promoción', example: '50% OFF en tu primera visita' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Tipo de promoción', enum: PromotionType })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({ description: 'Vertical', enum: Vertical })
  @IsEnum(Vertical)
  vertical: Vertical;

  @ApiProperty({ description: 'Valor del descuento', example: 50 })
  @IsNumber()
  discountValue: number;

  @ApiPropertyOptional({ description: 'Compra mínima' })
  @IsOptional()
  @IsNumber()
  minPurchase?: number;

  @ApiPropertyOptional({ description: 'Descuento máximo' })
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiProperty({ description: 'Fecha de inicio' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'ID de la comuna' })
  @IsUUID()
  comunaId: string;

  @ApiPropertyOptional({ description: 'ID del comercio (opcional)' })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional({ description: 'Código de cupón' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
