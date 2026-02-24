import { IsString, MinLength, IsOptional, IsEnum, IsUUID, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Vertical } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Masajes' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'masajes' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiProperty({ enum: Vertical })
  @IsEnum(Vertical)
  vertical: Vertical;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;
}
