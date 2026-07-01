import { Module } from '@nestjs/common';
import { UploadsController } from './infrastructure/http/uploads.controller';

@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
