import {
  IsUUID,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID del servicio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'Fecha de la reserva (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  date: string;

  @ApiProperty({
    description: 'Hora de inicio (HH:MM)',
    example: '14:30',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora debe tener formato HH:MM',
  })
  startTime: string;

  @ApiPropertyOptional({
    description: 'ID del personal (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({
    description: 'Cantidad de participantes',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  attendees?: number;

  @ApiPropertyOptional({
    description: 'ID de la promoción a aplicar',
  })
  @IsOptional()
  @IsUUID()
  promotionId?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Preferencia por ventana',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
