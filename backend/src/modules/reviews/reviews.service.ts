import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto, userId: string) {
    const { businessId, bookingId, rating, comment } = createReviewDto;

    // Verifica que el usuario tenga una reserva completada en el negocio
    if (bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          customerId: userId,
          businessId,
          status: 'COMPLETED',
        },
      });

      if (!booking) {
        throw new BadRequestException('Debes tener una reserva completada para dejar una reseña');
      }
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        businessId,
        bookingId,
        rating,
        comment,
        isVerified: !!bookingId,
      },
    });

    // Actualiza el rating promedio del negocio
    await this.updateBusinessRating(businessId);

    return review;
  }

  async findByBusiness(businessId: string) {
    return this.prisma.review.findMany({
      where: { businessId, isVisible: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (review.userId !== userId) throw new BadRequestException('No puedes editar esta reseña');

    const updated = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
    });

    await this.updateBusinessRating(review.businessId);
    return updated;
  }

  private async updateBusinessRating(businessId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { businessId, isVisible: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.id,
      },
    });
  }
}
