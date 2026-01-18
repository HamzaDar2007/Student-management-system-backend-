import { Module } from '@nestjs/common';
import { AcademicTermsService } from './academic-terms.service';
import { AcademicTermsController } from './academic-terms.controller';

@Module({
  controllers: [AcademicTermsController],
  providers: [AcademicTermsService],
})
export class AcademicTermsModule {}
