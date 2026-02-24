import { Module } from '@nestjs/common';
import { VerticalsService } from './verticals.service';
import { VerticalsController } from './verticals.controller';

@Module({
  providers: [VerticalsService],
  controllers: [VerticalsController],
  exports: [VerticalsService],
})
export class VerticalsModule {}
