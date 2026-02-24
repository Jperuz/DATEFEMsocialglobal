import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, UserStatus } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo usuario
   */
  async create(createUserDto: CreateUserDto) {
    // Verifica si el email ya existe
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashea la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        comunaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Usuario creado: ${user.email}`);
    return user;
  }

  /**
   * Busca todos los usuarios con filtros y paginación
   */
  async findAll(query: QueryUsersDto) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      comunaId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Construye el filtro where
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (comunaId) {
      where.comunaId = comunaId;
    }

    // Ejecuta la consulta
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          comunaId: true,
          emailVerified: true,
          phoneVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca un usuario por ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Busca un usuario por email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Actualiza un usuario
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verifica que el usuario existe
    await this.findById(id);

    // Si se está actualizando el email, verifica que no exista
    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        comunaId: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Usuario actualizado: ${user.email}`);
    return user;
  }

  /**
   * Elimina un usuario
   */
  async remove(id: string) {
    // Verifica que el usuario existe
    await this.findById(id);

    // Verifica que no tenga negocios asociados
    const businessesCount = await this.prisma.business.count({
      where: { ownerId: id },
    });

    if (businessesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el usuario porque tiene negocios asociados',
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`Usuario eliminado: ${id}`);
    return { message: 'Usuario eliminado exitosamente' };
  }

  /**
   * Actualiza el avatar del usuario
   */
  async updateAvatar(id: string, avatarUrl: string) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });
  }

  /**
   * Cambia el estado de un usuario
   */
  async changeStatus(id: string, status: UserStatus) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Obtiene las estadísticas de un usuario
   */
  async getUserStats(id: string) {
    await this.findById(id);

    const [bookingsCount, reviewsCount, favoritesCount] = await Promise.all([
      this.prisma.booking.count({
        where: { customerId: id },
      }),
      this.prisma.review.count({
        where: { userId: id },
      }),
      this.prisma.favorite.count({
        where: { userId: id },
      }),
    ]);

    return {
      userId: id,
      bookingsCount,
      reviewsCount,
      favoritesCount,
    };
  }
}
