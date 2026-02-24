import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VerticalsService } from './verticals.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Vertical } from '@prisma/client';

@ApiTags('Verticals')
@Controller('verticals')
export class VerticalsController {
  constructor(private readonly verticalsService: VerticalsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todas las verticales' })
  findAll() {
    return this.verticalsService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener vertical por ID' })
  findOne(
    @Param('id') id: Vertical,
    @CurrentUser('comunaId') comunaId?: string,
  ) {
    return this.verticalsService.findById(id, comunaId);
  }

  @Get(':id/businesses')
  @Public()
  @ApiOperation({ summary: 'Obtener comercios de una vertical' })
  getBusinesses(
    @Param('id') id: Vertical,
    @CurrentUser('comunaId') comunaId?: string,
  ) {
    return this.verticalsService.getBusinessesByVertical(id, comunaId);
  }
}
