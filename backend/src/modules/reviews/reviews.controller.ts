import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear reseña' })
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.create(createReviewDto, userId);
  }

  @Get('business/:businessId')
  @Public()
  @ApiOperation({ summary: 'Obtener reseñas de un comercio' })
  findByBusiness(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.reviewsService.findByBusiness(businessId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar reseña' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.update(id, updateReviewDto, userId);
  }
}
