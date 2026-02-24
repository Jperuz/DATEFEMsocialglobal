import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { QueryBusinessesDto } from './dto/query-businesses.dto';
import { Role, BusinessStatus, Vertical } from '@prisma/client';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createBusinessDto: CreateBusinessDto, ownerId: string) {
    // Verifica si el slug ya existe
    const existing = await this.prisma.business.findUnique({
      where: { slug: createBusinessDto.slug },
    });

    if (existing) {
      throw new ConflictException('Ya existe un comercio con ese slug');
    }

    const business = await this.prisma.business.create({
      data: {
        ...createBusinessDto,
        ownerId,
        status: BusinessStatus.PENDING,
      },
    });

    this.logger.log(`Comercio creado: ${business.name}`);
    return business;
  }

  async findAll(query: QueryBusinessesDto, comunaId?: string) {
    const {
      page = 1,
      limit = 20,
      search,
      vertical,
      categoryId,
      status,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (comunaId) {
      where.comunaId = comunaId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (vertical) {
      where.vertical = vertical;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = BusinessStatus.ACTIVE;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: {
              services: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      data: businesses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        category: true,
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        services: {
          where: { isActive: true },
          include: {
            staff: {
              include: {
                staff: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, avatarUrl: true },
                    },
                  },
                },
              },
            },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: {
            services: true,
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Comercio no encontrado');
    }

    return business;
  }

  async findBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: {
        category: true,
        services: {
          where: { isActive: true },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: {
            services: true,
            reviews: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Comercio no encontrado');
    }

    return business;
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto, userId: string, userRole: Role) {
    const business = await this.findById(id);

    // Verifica permisos
    if (userRole !== Role.SUPER_ADMIN && userRole !== Role.COMUNA_ADMIN) {
      if (business.ownerId !== userId) {
        throw new ForbiddenException('No tienes permiso para editar este comercio');
      }
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: updateBusinessDto,
    });

    this.logger.log(`Comercio actualizado: ${updated.name}`);
    return updated;
  }

  async changeStatus(id: string, status: BusinessStatus, userId: string, userRole: Role) {
    const business = await this.findById(id);

    // Solo admins pueden cambiar estado
    if (userRole !== Role.SUPER_ADMIN && userRole !== Role.COMUNA_ADMIN) {
      throw new ForbiddenException('No tienes permiso para cambiar el estado');
    }

    return this.prisma.business.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const business = await this.findById(id);

    // Verifica permisos
    if (userRole !== Role.SUPER_ADMIN && userRole !== Role.COMUNA_ADMIN) {
      if (business.ownerId !== userId) {
        throw new ForbiddenException('No tienes permiso para eliminar este comercio');
      }
    }

    await this.prisma.business.delete({
      where: { id },
    });

    this.logger.log(`Comercio eliminado: ${id}`);
    return { message: 'Comercio eliminado exitosamente' };
  }

  async getMyBusinesses(ownerId: string) {
    return this.prisma.business.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: {
            services: true,
            bookings: true,
          },
        },
      },
    });
  }

  async getBusinessStats(id: string) {
    await this.findById(id);

    const [
      totalBookings,
      completedBookings,
      pendingBookings,
      totalRevenue,
      reviewsCount,
      averageRating,
    ] = await Promise.all([
      this.prisma.booking.count({ where: { businessId: id } }),
      this.prisma.booking.count({ where: { businessId: id, status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { businessId: id, status: 'PENDING' } }),
      this.prisma.booking.aggregate({
        where: { businessId: id, status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      this.prisma.review.count({ where: { businessId: id } }),
      this.prisma.review.aggregate({
        where: { businessId: id },
        _avg: { rating: true },
      }),
    ]);

    return {
      businessId: id,
      totalBookings,
      completedBookings,
      pendingBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      reviewsCount,
      averageRating: averageRating._avg.rating || 0,
    };
  }
}
