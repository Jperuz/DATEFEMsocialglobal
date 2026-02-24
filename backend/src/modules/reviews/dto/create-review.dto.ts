import { IsUUID, IsInt, Min, Max, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID del comercio' })
  @IsUUID()
  businessId: string;

  @ApiPropertyOptional({ description: 'ID de la reserva' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ description: 'Calificación (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentario' })
  @IsOptional()
  @IsString()
  comment?: string;
}
