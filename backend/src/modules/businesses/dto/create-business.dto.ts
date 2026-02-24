import {
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsUUID,
  IsEmail,
  IsUrl,
  IsArray,
  IsJSON,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Vertical } from '@prisma/client';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Nombre del comercio',
    example: 'Spa Relax Total',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Slug único para URL',
    example: 'spa-relax-total',
  })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({
    description: 'Descripción del comercio',
    example: 'El mejor spa de la ciudad',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Vertical del negocio',
    enum: Vertical,
    example: 'BIENESTAR',
  })
  @IsEnum(Vertical)
  vertical: Vertical;

  @ApiProperty({
    description: 'ID de la categoría',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Email del comercio',
    example: 'contacto@sparelax.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Teléfono del comercio',
    example: '+541123456789',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Dirección del comercio',
    example: 'Av. Santa Fe 1234',
  })
  @IsString()
  address: string;

  @ApiPropertyOptional({
    description: 'Latitud',
    example: -34.5889,
  })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud',
    example: -58.3928,
  })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'URL del logo',
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'URL del banner',
  })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'URLs de la galería de imágenes',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  galleryUrls?: string[];

  @ApiPropertyOptional({
    description: 'Horarios de atención (JSON)',
    example: { monday: { open: '09:00', close: '18:00' } },
  })
  @IsOptional()
  schedule?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Configuración adicional (JSON)',
  })
  @IsOptional()
  settings?: Record<string, any>;

  @ApiProperty({
    description: 'ID de la comuna',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  comunaId: string;
}
