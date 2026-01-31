import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) throw new ConflictException('Email or username already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email,
        username: dto.username,
        passwordHash,
        role: dto.role,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        isActive: dto.isActive ?? true,
      }),
    );

    return this.sanitize(user);
  }

  async findAll(query: UserListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const findOptions: import('typeorm').FindManyOptions<User> = {
      order: { id: 'DESC' },
      skip,
      take: limit,
      where: {},
    };

    if (query.role) findOptions.where.role = query.role;

    // Handle includeDeleted
    // If includeDeleted is true, we fetch everything (including deleted).
    // If specific logic is needed (only deleted vs all), adjust here.
    // Assuming includeDeleted means "show active + deleted".
    if (query.includeDeleted) {
      findOptions.withDeleted = true;
    }

    const search = query.search?.trim();
    if (search) {
      findOptions.where = [
        { ...findOptions.where, email: ILike(`%${search}%`) },
        { ...findOptions.where, username: ILike(`%${search}%`) },
        { ...findOptions.where, firstName: ILike(`%${search}%`) },
        { ...findOptions.where, lastName: ILike(`%${search}%`) },
      ];
    }

    const [items, total] = await this.userRepo.findAndCount(findOptions);

    return {
      data: items.map((u) => this.sanitize(u)),
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const emailUsed = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (emailUsed) throw new ConflictException('Email already in use');
    }
    if (dto.username && dto.username !== user.username) {
      const usernameUsed = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (usernameUsed) throw new ConflictException('Username already in use');
    }

    Object.assign(user, {
      email: dto.email ?? user.email,
      username: dto.username ?? user.username,
      role: dto.role ?? user.role,
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      isActive: dto.isActive ?? user.isActive,
    });

    const saved = await this.userRepo.save(user);
    return this.sanitize(saved);
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.softRemove(user);
    return { deleted: true };
  }

  async restore(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.deletedAt) throw new ConflictException('User is not deleted');
    await this.userRepo.restore(id);
    const restored = await this.userRepo.findOne({ where: { id } });
    return this.sanitize(restored!);
  }

  async findDeleted() {
    const users = await this.userRepo.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
    });
    return users.map((u) => this.sanitize(u));
  }

  private sanitize(user: User): Omit<User, 'passwordHash' | 'refreshToken'> {
    const {
      passwordHash: _passwordHash,
      refreshToken: _refreshToken,
      ...rest
    } = user;
    return rest;
  }
}
