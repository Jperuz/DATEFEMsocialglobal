import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ValidateQRDto } from './dto/validate-qr.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Bookings')
@Controller('bookings')
@ApiBearerAuth('JWT-auth')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Horario no disponible' })
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.create(createBookingDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener reservas del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de reservas' })
  findAll(
    @Query() query: QueryBookingsDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.bookingsService.findAll(query, userId, userRole);
  }

  @Get('available-slots')
  @Public()
  @ApiOperation({ summary: 'Obtener horarios disponibles' })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'staffId', required: false })
  @ApiResponse({ status: 200, description: 'Horarios disponibles' })
  getAvailableSlots(
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.bookingsService.getAvailableSlots(serviceId, date, staffId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una reserva por ID' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.bookingsService.findById(id, userId, userRole);
  }

  @Get('reference/:code')
  @ApiOperation({ summary: 'Obtener reserva por código de referencia' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  findByReference(@Param('code') code: string) {
    return this.bookingsService.findByReferenceCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una reserva' })
  @ApiResponse({ status: 200, description: 'Reserva actualizada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.bookingsService.update(id, updateBookingDto, userId, userRole);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.COMUNA_ADMIN, Role.BUSINESS_OWNER, Role.BUSINESS_STAFF)
  @ApiOperation({ summary: 'Cambiar estado de la reserva' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.bookingsService.changeStatus(id, changeStatusDto.status, userId, userRole);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una reserva' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, userId, userRole, reason);
  }

  @Post('validate-qr')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar código QR' })
  @ApiResponse({ status: 200, description: 'QR validado exitosamente' })
  validateQR(
    @Body() validateQRDto: ValidateQRDto,
    @CurrentUser('id') validatorId: string,
  ) {
    return this.bookingsService.validateQR(validateQRDto.code, validatorId);
  }
}
