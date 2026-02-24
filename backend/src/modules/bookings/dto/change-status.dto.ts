import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la reserva',
    enum: BookingStatus,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
