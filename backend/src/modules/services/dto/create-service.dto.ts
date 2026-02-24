import { IsString, MinLength, IsUUID, IsOptional, IsInt, Min, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty({ example: 'Masaje Relajante' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID del comercio' })
  @IsUUID()
  businessId: string;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Duración en minutos', example: 60 })
  @IsInt()
  @Min(5)
  duration: number;

  @ApiProperty({ description: 'Precio', example: 5000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Precio anterior (para mostrar descuento)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: ServiceType, default: ServiceType.APPOINTMENT })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;
}
