import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, PaymentMethod, BookingStatus } from '@prisma/client';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private mpClient: MercadoPagoConfig;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Inicializa MercadoPago
    const accessToken = this.configService.get('mercadopago.accessToken');
    if (accessToken) {
      this.mpClient = new MercadoPagoConfig({
        accessToken,
        options: { timeout: 5000 },
      });
    }
  }

  async create(createPaymentDto: CreatePaymentDto, userId: string) {
    const { bookingId, method } = createPaymentDto;

    // Obtiene la reserva
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        business: true,
        customer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (booking.customerId !== userId) {
      throw new BadRequestException('La reserva no pertenece al usuario');
    }

    if (booking.paymentId) {
      throw new BadRequestException('La reserva ya tiene un pago asociado');
    }

    // Crea el registro de pago
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: booking.totalAmount,
        currency: 'ARS',
        method,
        status: PaymentStatus.PENDING,
      },
    });

    // Actualiza la reserva con el ID de pago
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { paymentId: payment.id },
    });

    // Si es MercadoPago, crea la preferencia
    if (method === PaymentMethod.MERCADOPAGO && this.mpClient) {
      const preference = await this.createMercadoPagoPreference(booking, payment.id);
      
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          mpPreferenceId: preference.id,
          methodDetails: {
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
          },
        },
      });

      return {
        paymentId: payment.id,
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      };
    }

    return payment;
  }

  async findById(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.userId !== userId) {
      throw new BadRequestException('No tienes permiso para ver este pago');
    }

    return payment;
  }

  async findByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        bookings: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async processWebhook(payload: any) {
    this.logger.log('Webhook recibido de MercadoPago');

    const { data, type } = payload;

    if (type === 'payment') {
      const paymentId = data.id;
      await this.processMercadoPagoPayment(paymentId);
    }

    return { received: true };
  }

  async processMercadoPagoPayment(mpPaymentId: string) {
    if (!this.mpClient) {
      throw new BadRequestException('MercadoPago no está configurado');
    }

    try {
      const payment = new Payment(this.mpClient);
      const mpPayment = await payment.get({ id: mpPaymentId });

      const { status, status_detail, transaction_amount } = mpPayment;

      // Busca el pago en nuestra base de datos
      const dbPayment = await this.prisma.payment.findFirst({
        where: { mpPreferenceId: mpPayment.preference_id },
        include: { bookings: true },
      });

      if (!dbPayment) {
        this.logger.warn(`Pago no encontrado: ${mpPayment.preference_id}`);
        return;
      }

      // Mapea el estado de MP a nuestro estado
      let paymentStatus: PaymentStatus;
      if (status === 'approved') {
        paymentStatus = PaymentStatus.COMPLETED;
      } else if (status === 'pending' || status === 'in_process') {
        paymentStatus = PaymentStatus.PROCESSING;
      } else if (status === 'rejected' || status === 'cancelled') {
        paymentStatus = PaymentStatus.FAILED;
      } else {
        paymentStatus = PaymentStatus.PENDING;
      }

      // Actualiza el pago
      await this.prisma.payment.update({
        where: { id: dbPayment.id },
        data: {
          status: paymentStatus,
          mpPaymentId: mpPaymentId,
          mpPaymentType: mpPayment.payment_type_id,
          mpStatusDetail: status_detail,
          webhookData: mpPayment,
          webhookReceivedAt: new Date(),
        },
      });

      // Si el pago fue exitoso, confirma la reserva
      if (paymentStatus === PaymentStatus.COMPLETED) {
        for (const booking of dbPayment.bookings) {
          await this.prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.CONFIRMED,
              statusHistory: [
                ...(booking.statusHistory as any[]),
                {
                  status: BookingStatus.CONFIRMED,
                  timestamp: new Date().toISOString(),
                },
              ],
            },
          });
        }
        this.logger.log(`Pago completado y reserva confirmada: ${dbPayment.id}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error procesando pago de MercadoPago:', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden reembolsar pagos completados');
    }

    // TODO: Implementar reembolso con MercadoPago SDK
    // Esto requiere la API de reembolsos de MP

    const refundAmount = amount || payment.amount;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAmount: refundAmount,
        refundReason: 'Solicitud de reembolso',
        refundedAt: new Date(),
      },
    });

    return { message: 'Reembolso procesado' };
  }

  private async createMercadoPagoPreference(booking: any, paymentId: string) {
    if (!this.mpClient) {
      throw new BadRequestException('MercadoPago no está configurado');
    }

    const preference = new Preference(this.mpClient);

    const result = await preference.create({
      body: {
        items: [
          {
            id: booking.id,
            title: booking.service.name,
            description: `Reserva en ${booking.business.name}`,
            quantity: 1,
            unit_price: Number(booking.totalAmount),
            currency_id: 'ARS',
          },
        ],
        payer: {
          email: booking.customer.email,
          name: booking.customer.firstName,
          surname: booking.customer.lastName,
        },
        back_urls: {
          success: `${this.configService.get('mercadopago.successUrl')}?payment=${paymentId}`,
          failure: `${this.configService.get('mercadopago.failureUrl')}?payment=${paymentId}`,
          pending: `${this.configService.get('mercadopago.pendingUrl')}?payment=${paymentId}`,
        },
        auto_return: 'approved',
        external_reference: paymentId,
        notification_url: this.configService.get('mercadopago.webhookUrl'),
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    return result;
  }

  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await this.findById(paymentId, userId);
    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      createdAt: payment.createdAt,
      bookings: payment.bookings.map((b) => ({
        id: b.id,
        referenceCode: b.referenceCode,
        status: b.status,
      })),
    };
  }
}
