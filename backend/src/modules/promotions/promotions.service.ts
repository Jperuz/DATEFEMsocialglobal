import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';
import { PromotionStatus, Vertical } from '@prisma/client';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionDto) {
    const promotion = await this.prisma.promotion.create({
      data: createPromotionDto,
    });
    this.logger.log(`Promoción creada: ${promotion.title}`);
    return promotion;
  }

  async findAll(query: QueryPromotionsDto, comunaId?: string) {
    const { page = 1, limit = 20, vertical, status = 'ACTIVE' } = query;
    const skip = (page - 1) * limit;

    const where: any = { status };
    if (comunaId) where.comunaId = comunaId;
    if (vertical) where.vertical = vertical;

    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { business: { select: { name: true, logoUrl: true } } },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!promotion) throw new NotFoundException('Promoción no encontrada');
    return promotion;
  }

  async findByVertical(vertical: Vertical, comunaId?: string) {
    const where: any = { vertical, status: 'ACTIVE' };
    if (comunaId) where.comunaId = comunaId;

    return this.prisma.promotion.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { business: { select: { name: true, logoUrl: true } } },
    });
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto) {
    await this.findById(id);
    const updated = await this.prisma.promotion.update({
      where: { id },
      data: updatePromotionDto,
    });
    this.logger.log(`Promoción actualizada: ${updated.title}`);
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.promotion.delete({ where: { id } });
    this.logger.log(`Promoción eliminada: ${id}`);
    return { message: 'Promoción eliminada' };
  }
}
