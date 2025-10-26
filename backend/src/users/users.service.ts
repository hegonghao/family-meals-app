import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPreferenceDto } from './dto/update-user-preference.dto';
import { UserPreferenceDto } from './dto/user-preference.dto';
import { User } from './entities/user.entity';
import { UserPreference } from './entities/user-preference.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserPreference)
    private readonly preferenceRepository: Repository<UserPreference>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      username: dto.username,
      displayName: dto.displayName?.trim() || dto.username,
      passwordHash,
      role: dto.role,
    });

    return this.usersRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByUsernameWithPassword(username: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :username', { username })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .addSelect('user.passwordHash')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.username && dto.username !== user.username) {
      const duplicate = await this.usersRepository.findOne({ where: { username: dto.username } });
      if (duplicate) {
        throw new ConflictException('Username already exists');
      }
      user.username = dto.username;
    }

    if (dto.displayName) {
      user.displayName = dto.displayName;
    }

    if (typeof dto.isActive === 'boolean') {
      user.isActive = dto.isActive;
    }

    if (dto.role) {
      user.role = dto.role;
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.usersRepository.save(user);
  }

  async updateOwnProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .addSelect('user.passwordHash')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let hasChanges = false;

    if (dto.displayName !== undefined) {
      const trimmedName = dto.displayName.trim();
      if (!trimmedName) {
        throw new BadRequestException('Display name cannot be empty');
      }
      if (trimmedName !== user.displayName) {
        user.displayName = trimmedName;
        hasChanges = true;
      }
    }

    if (dto.newPassword) {
      const currentPassword = dto.currentPassword ?? '';
      const matches = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!matches) {
        throw new BadRequestException('Current password is incorrect');
      }

      const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
      if (isSamePassword) {
        throw new BadRequestException('New password must be different from the current password');
      }

      user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
      hasChanges = true;
    }

    if (!hasChanges) {
      return this.findOne(user.id);
    }

    await this.usersRepository.save(user);

    return this.findOne(user.id);
  }

  async delete(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot delete admin users');
    }

    await this.usersRepository.remove(user);

    return { message: 'User deleted successfully' };
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Get user preferences (creates default if not exists)
   */
  async getPreferences(userId: string): Promise<UserPreferenceDto> {
    // First verify user exists
    const user = await this.findOne(userId);

    let preference = await this.preferenceRepository.findOne({
      where: { userId },
    });

    // Auto-create default preference if not exists
    if (!preference) {
      preference = this.preferenceRepository.create({
        userId,
        remindersEnabled: true, // Default: enabled
      });
      preference = await this.preferenceRepository.save(preference);
    }

    return {
      id: preference.id,
      userId: preference.userId,
      remindersEnabled: preference.remindersEnabled,
    };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    dto: UpdateUserPreferenceDto,
  ): Promise<UserPreferenceDto> {
    // First verify user exists
    await this.findOne(userId);

    let preference = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      // Create if not exists
      preference = this.preferenceRepository.create({
        userId,
        remindersEnabled: dto.remindersEnabled ?? true,
      });
    } else {
      // Update existing
      if (dto.remindersEnabled !== undefined) {
        preference.remindersEnabled = dto.remindersEnabled;
      }
    }

    preference = await this.preferenceRepository.save(preference);

    return {
      id: preference.id,
      userId: preference.userId,
      remindersEnabled: preference.remindersEnabled,
    };
  }
}

