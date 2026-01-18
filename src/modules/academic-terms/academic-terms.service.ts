import { Injectable } from '@nestjs/common';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';

@Injectable()
export class AcademicTermsService {
  create(createAcademicTermDto: CreateAcademicTermDto) {
    return 'This action adds a new academicTerm';
  }

  findAll() {
    return `This action returns all academicTerms`;
  }

  findOne(id: number) {
    return `This action returns a #${id} academicTerm`;
  }

  update(id: number, updateAcademicTermDto: UpdateAcademicTermDto) {
    return `This action updates a #${id} academicTerm`;
  }

  remove(id: number) {
    return `This action removes a #${id} academicTerm`;
  }
}
