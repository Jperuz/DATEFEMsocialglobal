import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role, Vertical } from '@prisma/client';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMUNA_ADMIN, Role.BUSINESS_OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear promoción' })
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener promociones' })
  findAll(
    @Query() query: QueryPromotionsDto,
    @CurrentUser('comunaId') comunaId?: string,
  ) {
    return this.promotionsService.findAll(query, comunaId);
  }

  @Get('vertical/:vertical')
  @Public()
  @ApiOperation({ summary: 'Obtener promociones por vertical' })
  findByVertical(
    @Param('vertical') vertical: Vertical,
    @CurrentUser('comunaId') comunaId?: string,
  ) {
    return this.promotionsService.findByVertical(vertical, comunaId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener promoción por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMUNA_ADMIN, Role.BUSINESS_OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar promoción' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMUNA_ADMIN, Role.BUSINESS_OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar promoción' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.remove(id);
  }
}
