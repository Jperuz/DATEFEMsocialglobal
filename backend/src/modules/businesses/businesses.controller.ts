import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { QueryBusinessesDto } from './dto/query-businesses.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role, BusinessStatus } from '@prisma/client';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear un nuevo comercio' })
  @ApiResponse({ status: 201, description: 'Comercio creado exitosamente' })
  create(
    @Body() createBusinessDto: CreateBusinessDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.businessesService.create(createBusinessDto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todos los comercios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'vertical', required: false, enum: ['SALUD', 'BELLEZA', 'DATEFIT', 'SERVICIOS', 'BIENESTAR'] })
  @ApiResponse({ status: 200, description: 'Lista de comercios' })
  findAll(
    @Query() query: QueryBusinessesDto,
    @CurrentUser('comunaId') comunaId?: string,
  ) {
    return this.businessesService.findAll(query, comunaId);
  }

  @Get('my-businesses')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mis comercios' })
  @ApiResponse({ status: 200, description: 'Lista de comercios del usuario' })
  getMyBusinesses(@CurrentUser('id') userId: string) {
    return this.businessesService.getMyBusinesses(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener un comercio por ID' })
  @ApiResponse({ status: 200, description: 'Comercio encontrado' })
  @ApiResponse({ status: 404, description: 'Comercio no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Obtener un comercio por slug' })
  @ApiResponse({ status: 200, description: 'Comercio encontrado' })
  findBySlug(@Param('slug') slug: string) {
    return this.businessesService.findBySlug(slug);
  }

  @Get(':id/stats')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.SUPER_ADMIN, Role.COMUNA_ADMIN, Role.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Obtener estadísticas del comercio' })
  @ApiResponse({ status: 200, description: 'Estadísticas del comercio' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.getBusinessStats(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar un comercio' })
  @ApiResponse({ status: 200, description: 'Comercio actualizado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.businessesService.update(id, updateBusinessDto, userId, userRole);
  }

  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.SUPER_ADMIN, Role.COMUNA_ADMIN)
  @ApiOperation({ summary: 'Cambiar estado del comercio' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.businessesService.changeStatus(id, changeStatusDto.status, userId, userRole);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un comercio' })
  @ApiResponse({ status: 204, description: 'Comercio eliminado' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.businessesService.remove(id, userId, userRole);
  }
}
