import { Module } from '@nestjs/common';
import { DocAcknowledgementController } from './doc-acknowledgement.controller';
import { DocAcknowledgementService } from './doc-acknowledgement.service';

@Module({
  controllers: [DocAcknowledgementController],
  providers: [DocAcknowledgementService],
})
export class DocAcknowledgementModule {}
