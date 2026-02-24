import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiPropertyOptional({
    description: 'Monto a reembolsar (si no se especifica, reembolsa el total)',
    example: 100.50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
