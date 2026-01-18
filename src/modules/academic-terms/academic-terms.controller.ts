import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AcademicTermsService } from './academic-terms.service';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';

@Controller('academic-terms')
export class AcademicTermsController {
  constructor(private readonly academicTermsService: AcademicTermsService) {}

  @Post()
  create(@Body() createAcademicTermDto: CreateAcademicTermDto) {
    return this.academicTermsService.create(createAcademicTermDto);
  }

  @Get()
  findAll() {
    return this.academicTermsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicTermsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAcademicTermDto: UpdateAcademicTermDto) {
    return this.academicTermsService.update(+id, updateAcademicTermDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.academicTermsService.remove(+id);
  }
}
