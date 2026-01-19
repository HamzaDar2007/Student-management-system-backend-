import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicTermsService } from './academic-terms.service';
import { AcademicTermsController } from './academic-terms.controller';
import { AcademicTerm } from './entities/academic-term.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicTerm])],
  controllers: [AcademicTermsController],
  providers: [AcademicTermsService],
  exports: [AcademicTermsService],
})
export class AcademicTermsModule {}
