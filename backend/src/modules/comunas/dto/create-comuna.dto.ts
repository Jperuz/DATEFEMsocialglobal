import { IsString, MinLength, IsOptional, IsHexColor } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComunaDto {
  @ApiProperty({
    description: 'Nombre de la comuna',
    example: 'Palermo',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Slug único para URL',
    example: 'palermo',
  })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({
    description: 'Descripción de la comuna',
    example: 'La comuna más grande de Buenos Aires',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL del logo',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'URL del banner',
  })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'Color primario (hex)',
    example: '#FF6B9D',
  })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Color secundario (hex)',
    example: '#4ECDC4',
  })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiPropertyOptional({
    description: 'Configuración adicional en JSON',
  })
  @IsOptional()
  settings?: Record<string, any>;
}
