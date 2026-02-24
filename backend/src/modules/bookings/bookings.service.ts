import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { BookingStatus, Role, PaymentStatus } from '@prisma/client';
import { addMinutes, isBefore, isAfter, addHours } from 'date-fns';
import * as QRCode from 'qrcode';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto, customerId: string) {
    const { serviceId, date, startTime, staffId, attendees, promotionId } = createBookingDto;

    // Obtiene el servicio
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    if (!service.isActive) {
      throw new BadRequestException('El servicio no está disponible');
    }

    // Calcula horarios
    const bookingDate = new Date(date);
    const [hours, minutes] = startTime.split(':').map(Number);
    bookingDate.setHours(hours, minutes, 0, 0);

    const endTime = addMinutes(bookingDate, service.duration);

    // Verifica disponibilidad
    const isAvailable = await this.checkAvailability(
      serviceId,
      staffId,
      bookingDate,
      endTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('El horario seleccionado no está disponible');
    }

    // Calcula precios
    let subtotal = Number(service.price) * (attendees || 1);
    let discountAmount = 0;

    // Aplica promoción si existe
    if (promotionId) {
      const promotion = await this.prisma.promotion.findUnique({
        where: { id: promotionId },
      });

      if (promotion && promotion.status === 'ACTIVE') {
        if (promotion.type === 'PERCENTAGE') {
          discountAmount = subtotal * (Number(promotion.discountValue) / 100);
          if (promotion.maxDiscount && discountAmount > Number(promotion.maxDiscount)) {
            discountAmount = Number(promotion.maxDiscount);
          }
        } else if (promotion.type === 'FIXED_AMOUNT') {
          discountAmount = Number(promotion.discountValue);
        }
        subtotal -= discountAmount;
      }
    }

    const taxRate = 0.21; // 21% IVA
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Genera código QR
    const referenceCode = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const qrData = JSON.stringify({
      bookingRef: referenceCode,
      service: service.name,
      date: bookingDate.toISOString(),
    });
    const qrCode = await QRCode.toDataURL(qrData);

    // Crea la reserva
    const booking = await this.prisma.booking.create({
      data: {
        referenceCode,
        customerId,
        businessId: service.businessId,
        serviceId,
        staffId,
        date: new Date(date),
        startTime: bookingDate,
        endTime,
        attendees: attendees || 1,
        customerNotes: createBookingDto.notes,
        promotionId,
        discountAmount,
        subtotal,
        taxAmount,
        totalAmount,
        qrCode,
        status: BookingStatus.PENDING,
        statusHistory: [
          { status: BookingStatus.PENDING, timestamp: new Date().toISOString() },
        ],
      },
      include: {
        service: true,
        business: {
          select: { name: true, address: true, phone: true },
        },
      },
    });

    this.logger.log(`Reserva creada: ${booking.referenceCode}`);
    return booking;
  }

  async findAll(query: QueryBookingsDto, userId: string, userRole: Role) {
    const {
      page = 1,
      limit = 20,
      status,
      businessId,
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Filtra según el rol
    if (userRole === Role.CUSTOMER) {
      where.customerId = userId;
    } else if (userRole === Role.BUSINESS_OWNER) {
      where.business = { ownerId: userId };
    } else if (businessId) {
      where.businessId = businessId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          service: {
            select: { name: true, duration: true, price: true },
          },
          business: {
            select: { name: true, address: true, phone: true },
          },
          payment: {
            select: { status: true, method: true },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string, userRole: Role) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        business: true,
        customer: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        staff: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        payment: true,
        promotion: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Verifica permisos
    if (userRole === Role.CUSTOMER && booking.customerId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta reserva');
    }

    if (userRole === Role.BUSINESS_OWNER && booking.business.ownerId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta reserva');
    }

    return booking;
  }

  async findByReferenceCode(code: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { referenceCode: code },
      include: {
        service: true,
        business: true,
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId: string,
    userRole: Role,
  ) {
    const booking = await this.findById(id, userId, userRole);

    // Solo ciertos campos pueden actualizarse
    const allowedUpdates: any = {};

    if (updateBookingDto.notes !== undefined) {
      allowedUpdates.customerNotes = updateBookingDto.notes;
    }

    if (updateBookingDto.staffNotes !== undefined && userRole !== Role.CUSTOMER) {
      allowedUpdates.staffNotes = updateBookingDto.staffNotes;
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: allowedUpdates,
    });

    this.logger.log(`Reserva actualizada: ${booking.referenceCode}`);
    return updated;
  }

  async changeStatus(
    id: string,
    status: BookingStatus,
    userId: string,
    userRole: Role,
  ) {
    const booking = await this.findById(id, userId, userRole);

    // Valida transiciones de estado
    const validTransitions = this.getValidTransitions(booking.status);
    if (!validTransitions.includes(status)) {
      throw new BadRequestException(
        `No se puede cambiar de ${booking.status} a ${status}`,
      );
    }

    // Actualiza historial de estados
    const statusHistory = [
      ...(booking.statusHistory as any[]),
      { status, timestamp: new Date().toISOString(), changedBy: userId },
    ];

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status,
        statusHistory,
      },
    });

    this.logger.log(`Estado de reserva cambiado: ${booking.referenceCode} -> ${status}`);
    return updated;
  }

  async cancel(id: string, userId: string, userRole: Role, reason?: string) {
    const booking = await this.findById(id, userId, userRole);

    // Verifica que no esté ya cancelada o completada
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar una reserva completada');
    }

    // Verifica tiempo límite para cancelación (24h antes)
    const cancelDeadline = addHours(booking.startTime, -24);
    if (isBefore(new Date(), cancelDeadline) && userRole === Role.CUSTOMER) {
      throw new BadRequestException(
        'Las reservas solo pueden cancelarse hasta 24 horas antes',
      );
    }

    const updated = await this.changeStatus(
      id,
      BookingStatus.CANCELLED,
      userId,
      userRole,
    );

    // Si hay pago, marca para reembolso
    if (booking.paymentId) {
      await this.prisma.payment.update({
        where: { id: booking.paymentId },
        data: { status: PaymentStatus.CANCELLED },
      });
    }

    this.logger.log(`Reserva cancelada: ${booking.referenceCode}`);
    return updated;
  }

  async validateQR(code: string, validatorId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { referenceCode: code },
    });

    if (!booking) {
      throw new NotFoundException('Código QR no válido');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(`La reserva no está confirmada (estado: ${booking.status})`);
    }

    // Verifica que la fecha sea hoy
    const today = new Date();
    const bookingDate = new Date(booking.date);
    if (
      today.getDate() !== bookingDate.getDate() ||
      today.getMonth() !== bookingDate.getMonth() ||
      today.getFullYear() !== bookingDate.getFullYear()
    ) {
      throw new BadRequestException('La reserva no es para hoy');
    }

    // Actualiza la reserva
    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.IN_PROGRESS,
        qrValidatedAt: new Date(),
        qrValidatedBy: validatorId,
        statusHistory: [
          ...(booking.statusHistory as any[]),
          {
            status: BookingStatus.IN_PROGRESS,
            timestamp: new Date().toISOString(),
            changedBy: validatorId,
          },
        ],
      },
    });

    this.logger.log(`QR validado: ${code}`);
    return updated;
  }

  async getAvailableSlots(serviceId: string, date: string, staffId?: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const queryDate = new Date(date);
    const dayOfWeek = queryDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Obtiene horario del negocio
    const schedule = service.business.schedule as any;
    if (!schedule || !schedule[dayName] || !schedule[dayName].open) {
      return { date, slots: [] };
    }

    const { open, close } = schedule[dayName];
    const [openHour, openMinute] = open.split(':').map(Number);
    const [closeHour, closeMinute] = close.split(':').map(Number);

    // Genera slots disponibles
    const slots: string[] = [];
    let currentTime = new Date(queryDate);
    currentTime.setHours(openHour, openMinute, 0, 0);

    const endTime = new Date(queryDate);
    endTime.setHours(closeHour, closeMinute, 0, 0);

    // Obtiene reservas existentes
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        serviceId,
        date: queryDate,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        ...(staffId && { staffId }),
      },
      select: { startTime: true, endTime: true },
    });

    while (isBefore(currentTime, endTime)) {
      const slotEndTime = addMinutes(currentTime, service.duration);
      
      // Verifica si el slot está disponible
      const isAvailable = !existingBookings.some((booking) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        return (
          (isAfter(currentTime, bookingStart) && isBefore(currentTime, bookingEnd)) ||
          (isAfter(slotEndTime, bookingStart) && isBefore(slotEndTime, bookingEnd)) ||
          (isBefore(currentTime, bookingStart) && isAfter(slotEndTime, bookingEnd))
        );
      });

      if (isAvailable) {
        slots.push(
          `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime
            .getMinutes()
            .toString()
            .padStart(2, '0')}`,
        );
      }

      // Avanza 30 minutos
      currentTime = addMinutes(currentTime, 30);
    }

    return { date, slots };
  }

  private async checkAvailability(
    serviceId: string,
    staffId: string | undefined,
    startTime: Date,
    endTime: Date,
  ): Promise<boolean> {
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        serviceId,
        ...(staffId && { staffId }),
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    return !existingBooking;
  }

  private getValidTransitions(currentStatus: BookingStatus): BookingStatus[] {
    const transitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.IN_PROGRESS,
        BookingStatus.CANCELLED,
        BookingStatus.NO_SHOW,
      ],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.NO_SHOW]: [],
    };

    return transitions[currentStatus] || [];
  }
}
