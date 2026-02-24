import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear servicio' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get('business/:businessId')
  @Public()
  @ApiOperation({ summary: 'Obtener servicios de un comercio' })
  findByBusiness(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.servicesService.findByBusiness(businessId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener servicio por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar servicio' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Roles(Role.BUSINESS_OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar servicio' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }
}
