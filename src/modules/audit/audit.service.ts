import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { AuditLog } from './entities/audit.entity';
import { CreateAuditDto } from './dto/create-audit.dto';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditDto): Promise<AuditLog> {
    const auditLog = this.auditRepo.create({
      userId: dto.user_id ?? null,
      action: dto.action,
      resource: dto.resource,
      resourceId: dto.resource_id ?? null,
      payload: dto.payload ?? null,
    });
    return this.auditRepo.save(auditLog);
  }

  async findAll(query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AuditLog> = {};
    if (query.user_id) where.userId = query.user_id;
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.resource_id) where.resourceId = query.resource_id;
    if (query.start_date && query.end_date) {
      where.createdAt = Between(
        new Date(query.start_date),
        new Date(query.end_date),
      );
    }

    const [items, total] = await this.auditRepo.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { page, limit, total, items };
  }

  async findOne(id: number) {
    const log = await this.auditRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    return log;
  }

  async findByResource(resource: string, resourceId: string) {
    return this.auditRepo.find({
      where: { resource, resourceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number, limit = 50) {
    return this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
