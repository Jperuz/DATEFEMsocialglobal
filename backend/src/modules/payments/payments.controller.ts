import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Headers,
  HttpCode,
  HttpStatus,
  RawBody,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pago' })
  @ApiResponse({ status: 201, description: 'Pago creado exitosamente' })
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.create(createPaymentDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener pagos del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de pagos' })
  findByUser(@CurrentUser('id') userId: string) {
    return this.paymentsService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago por ID' })
  @ApiResponse({ status: 200, description: 'Pago encontrado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.findById(id, userId);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Obtener estado del pago' })
  @ApiResponse({ status: 200, description: 'Estado del pago' })
  getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.getPaymentStatus(id, userId);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reembolsar un pago' })
  @ApiResponse({ status: 200, description: 'Reembolso procesado' })
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(id, refundPaymentDto.amount);
  }

  @Post('webhook/mercadopago')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de MercadoPago' })
  @ApiResponse({ status: 200, description: 'Webhook procesado' })
  async mercadoPagoWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    // TODO: Verificar firma del webhook
    return this.paymentsService.processWebhook(payload);
  }
}
