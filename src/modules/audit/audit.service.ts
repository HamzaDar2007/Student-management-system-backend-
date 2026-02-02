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
      userId: dto.userId ?? null,
      action: dto.action,
      resource: dto.resource,
      resourceId: dto.resourceId ?? null,
      payload: dto.payload ?? null,
    });
    return this.auditRepo.save(auditLog);
  }

  async findAll(query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AuditLog> = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.startDate && query.endDate) {
      where.createdAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }

    const [items, total] = await this.auditRepo.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
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

  async findByResource(resource: string, resourceId?: string) {
    const where: FindOptionsWhere<AuditLog> = { resource };
    if (resourceId) {
      where.resourceId = resourceId;
    }
    return this.auditRepo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
