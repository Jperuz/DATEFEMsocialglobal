import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ComunasService } from './comunas.service';
import { CreateComunaDto } from './dto/create-comuna.dto';
import { UpdateComunaDto } from './dto/update-comuna.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Comunas')
@Controller('comunas')
export class ComunasController {
  constructor(private readonly comunasService: ComunasService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear una nueva comuna' })
  @ApiResponse({ status: 201, description: 'Comuna creada exitosamente' })
  create(@Body() createComunaDto: CreateComunaDto) {
    return this.comunasService.create(createComunaDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todas las comunas activas' })
  @ApiResponse({ status: 200, description: 'Lista de comunas' })
  findAll() {
    return this.comunasService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener una comuna por ID' })
  @ApiResponse({ status: 200, description: 'Comuna encontrada' })
  @ApiResponse({ status: 404, description: 'Comuna no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comunasService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Obtener una comuna por slug' })
  @ApiResponse({ status: 200, description: 'Comuna encontrada' })
  findBySlug(@Param('slug') slug: string) {
    return this.comunasService.findBySlug(slug);
  }

  @Get(':id/stats')
  @Roles(Role.SUPER_ADMIN, Role.COMUNA_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener estadísticas de la comuna' })
  @ApiResponse({ status: 200, description: 'Estadísticas de la comuna' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.comunasService.getStats(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar una comuna' })
  @ApiResponse({ status: 200, description: 'Comuna actualizada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComunaDto: UpdateComunaDto,
  ) {
    return this.comunasService.update(id, updateComunaDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una comuna' })
  @ApiResponse({ status: 204, description: 'Comuna eliminada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.comunasService.remove(id);
  }
}
