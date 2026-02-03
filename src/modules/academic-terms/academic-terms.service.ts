import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicTerm } from './entities/academic-term.entity';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';

@Injectable()
export class AcademicTermsService {
  constructor(
    @InjectRepository(AcademicTerm)
    private readonly termRepo: Repository<AcademicTerm>,
  ) {}

  async create(dto: CreateAcademicTermDto) {
    const existingName = await this.termRepo.findOne({
      where: { name: dto.name },
    });
    if (existingName)
      throw new ConflictException('Academic term name already exists');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const term = this.termRepo.create({
      name: dto.name,
      startDate: startDate,
      endDate: endDate,
      isActive: dto.isActive ?? false,
    });

    // If setting this term as active, deactivate others
    if (term.isActive) {
      await this.termRepo.update({ isActive: true }, { isActive: false });
    }

    return this.termRepo.save(term);
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.termRepo.findAndCount({
      order: { startDate: 'DESC' },
      skip,
      take: limit,
    });
    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const term = await this.termRepo.findOne({ where: { id } });
    if (!term) throw new NotFoundException('Academic term not found');
    return term;
  }

  async findActive() {
    const term = await this.termRepo.findOne({ where: { isActive: true } });
    return term;
  }

  async update(id: string, dto: UpdateAcademicTermDto) {
    const term = await this.termRepo.findOne({ where: { id } });
    if (!term) throw new NotFoundException('Academic term not found');

    if (dto.name && dto.name !== term.name) {
      const existing = await this.termRepo.findOne({
        where: { name: dto.name },
      });
      if (existing)
        throw new ConflictException('Academic term name already exists');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : term.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : term.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // If setting this term as active, deactivate others
    if (dto.isActive === true && !term.isActive) {
      await this.termRepo
        .createQueryBuilder()
        .update()
        .set({ isActive: false })
        .where('id != :id', { id })
        .execute();
    }

    Object.assign(term, {
      name: dto.name ?? term.name,
      startDate: startDate,
      endDate: endDate,
      isActive: dto.isActive !== undefined ? dto.isActive : term.isActive,
    });

    return this.termRepo.save(term);
  }

  async remove(id: string) {
    const term = await this.termRepo.findOne({ where: { id } });
    if (!term) throw new NotFoundException('Academic term not found');

    if (term.isActive) {
      throw new ConflictException('Cannot delete an active academic term');
    }

    await this.termRepo.softRemove(term);
    return { deleted: true };
  }

  async restore(id: string) {
    const term = await this.termRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!term) {
      throw new NotFoundException(`Academic term with ID ${id} not found`);
    }

    if (!term.deletedAt) {
      throw new ConflictException(`Academic term with ID ${id} is not deleted`);
    }

    return this.termRepo.restore(id);
  }
}
