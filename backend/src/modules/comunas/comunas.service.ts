import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateComunaDto } from './dto/create-comuna.dto';
import { UpdateComunaDto } from './dto/update-comuna.dto';

@Injectable()
export class ComunasService {
  private readonly logger = new Logger(ComunasService.name);

  constructor(private prisma: PrismaService) {}

  async create(createComunaDto: CreateComunaDto) {
    // Verifica si el slug ya existe
    const existing = await this.prisma.comuna.findUnique({
      where: { slug: createComunaDto.slug },
    });

    if (existing) {
      throw new ConflictException('Ya existe una comuna con ese slug');
    }

    const comuna = await this.prisma.comuna.create({
      data: createComunaDto,
    });

    this.logger.log(`Comuna creada: ${comuna.name}`);
    return comuna;
  }

  async findAll() {
    return this.prisma.comuna.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            businesses: true,
            users: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const comuna = await this.prisma.comuna.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            businesses: true,
            users: true,
          },
        },
      },
    });

    if (!comuna) {
      throw new NotFoundException('Comuna no encontrada');
    }

    return comuna;
  }

  async findBySlug(slug: string) {
    const comuna = await this.prisma.comuna.findUnique({
      where: { slug },
      include: {
        businesses: {
          where: { status: 'ACTIVE' },
          take: 10,
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            vertical: true,
            rating: true,
          },
        },
        _count: {
          select: {
            businesses: true,
          },
        },
      },
    });

    if (!comuna) {
      throw new NotFoundException('Comuna no encontrada');
    }

    return comuna;
  }

  async update(id: string, updateComunaDto: UpdateComunaDto) {
    await this.findById(id);

    const comuna = await this.prisma.comuna.update({
      where: { id },
      data: updateComunaDto,
    });

    this.logger.log(`Comuna actualizada: ${comuna.name}`);
    return comuna;
  }

  async remove(id: string) {
    await this.findById(id);

    // Verifica que no tenga negocios
    const businessesCount = await this.prisma.business.count({
      where: { comunaId: id },
    });

    if (businessesCount > 0) {
      throw new ConflictException('No se puede eliminar la comuna porque tiene negocios asociados');
    }

    await this.prisma.comuna.delete({
      where: { id },
    });

    this.logger.log(`Comuna eliminada: ${id}`);
    return { message: 'Comuna eliminada exitosamente' };
  }

  async getStats(id: string) {
    await this.findById(id);

    const [
      businessesCount,
      usersCount,
      bookingsCount,
      promotionsCount,
    ] = await Promise.all([
      this.prisma.business.count({ where: { comunaId: id } }),
      this.prisma.user.count({ where: { comunaId: id } }),
      this.prisma.booking.count({
        where: { business: { comunaId: id } },
      }),
      this.prisma.promotion.count({ where: { comunaId: id } }),
    ]);

    return {
      comunaId: id,
      businessesCount,
      usersCount,
      bookingsCount,
      promotionsCount,
    };
  }
}
