import { Module } from '@nestjs/common';
import { ComunasService } from './comunas.service';
import { ComunasController } from './comunas.controller';

@Module({
  providers: [ComunasService],
  controllers: [ComunasController],
  exports: [ComunasService],
})
export class ComunasModule {}
