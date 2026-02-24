import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateQRDto {
  @ApiProperty({
    description: 'Código QR a validar',
    example: '1709834567890-abc123',
  })
  @IsString()
  code: string;
}
