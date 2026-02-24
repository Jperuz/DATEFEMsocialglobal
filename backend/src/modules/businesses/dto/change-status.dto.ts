import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del comercio',
    enum: BusinessStatus,
  })
  @IsEnum(BusinessStatus)
  status: BusinessStatus;
}
