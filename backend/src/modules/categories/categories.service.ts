import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Vertical } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({ data: createCategoryDto });
  }

  async findAll(vertical?: Vertical) {
    return this.prisma.category.findMany({
      where: { isActive: true, ...(vertical && { vertical }) },
      orderBy: { order: 'asc' },
      include: { _count: { select: { businesses: true } } },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async findByVertical(vertical: Vertical) {
    return this.prisma.category.findMany({
      where: { vertical, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findById(id);
    return this.prisma.category.update({ where: { id }, data: updateCategoryDto });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.category.delete({ where: { id } });
  }
}
