import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Vertical } from '@prisma/client';

@Injectable()
export class VerticalsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return Object.values(Vertical).map((key) => ({
      id: key,
      name: this.getVerticalName(key),
      description: this.getVerticalDescription(key),
      icon: this.getVerticalIcon(key),
    }));
  }

  async findById(id: Vertical, comunaId?: string) {
    const [businessesCount, categoriesCount, promotionsCount] = await Promise.all([
      this.prisma.business.count({
        where: { vertical: id, ...(comunaId && { comunaId }), status: 'ACTIVE' },
      }),
      this.prisma.category.count({ where: { vertical: id, isActive: true } }),
      this.prisma.promotion.count({
        where: { vertical: id, ...(comunaId && { comunaId }), status: 'ACTIVE' },
      }),
    ]);

    return {
      id,
      name: this.getVerticalName(id),
      description: this.getVerticalDescription(id),
      icon: this.getVerticalIcon(id),
      stats: {
        businessesCount,
        categoriesCount,
        promotionsCount,
      },
    };
  }

  async getBusinessesByVertical(vertical: Vertical, comunaId?: string) {
    return this.prisma.business.findMany({
      where: {
        vertical,
        status: 'ACTIVE',
        ...(comunaId && { comunaId }),
      },
      take: 20,
      include: {
        category: { select: { name: true } },
        _count: { select: { reviews: true } },
      },
    });
  }

  private getVerticalName(vertical: Vertical): string {
    const names: Record<Vertical, string> = {
      [Vertical.SALUD]: 'Salud',
      [Vertical.BELLEZA]: 'Belleza',
      [Vertical.DATEFIT]: 'DateFit',
      [Vertical.SERVICIOS]: 'Servicios',
      [Vertical.BIENESTAR]: 'Bienestar',
    };
    return names[vertical];
  }

  private getVerticalDescription(vertical: Vertical): string {
    const descriptions: Record<Vertical, string> = {
      [Vertical.SALUD]: 'Centros médicos, consultorios, odontología y más',
      [Vertical.BELLEZA]: 'Peluquerías, spas, uñas, maquillaje y más',
      [Vertical.DATEFIT]: 'Gimnasios, entrenadores, clases fitness y más',
      [Vertical.SERVICIOS]: 'Servicios profesionales para tu día a día',
      [Vertical.BIENESTAR]: 'Yoga, meditación, terapias alternativas y más',
    };
    return descriptions[vertical];
  }

  private getVerticalIcon(vertical: Vertical): string {
    const icons: Record<Vertical, string> = {
      [Vertical.SALUD]: 'heart-pulse',
      [Vertical.BELLEZA]: 'sparkles',
      [Vertical.DATEFIT]: 'dumbbell',
      [Vertical.SERVICIOS]: 'briefcase',
      [Vertical.BIENESTAR]: 'lotus',
    };
    return icons[vertical];
  }
}
