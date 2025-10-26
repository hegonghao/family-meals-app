import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserPreference } from './entities/user-preference.entity';
import { UsersService } from './users.service';

type MockRepository<T extends ObjectLiteral = any> = Partial<jest.Mocked<Repository<T>>>;
type MockQueryBuilder<T extends ObjectLiteral = any> = Partial<jest.Mocked<SelectQueryBuilder<T>>>;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let queryBuilder: MockQueryBuilder<User>;

  const baseUser: User = {
    id: 'b7d7a3e4-bca0-4ce3-906d-d3f39737b7f8',
    username: 'jane',
    displayName: 'Jane Doe',
    passwordHash: '$2b$10$examplehash',
    role: 'user' as any,
    isActive: true,
    lastLoginAt: new Date('2024-01-10T00:00:00Z'),
    createdAt: new Date('2024-01-10T00:00:00Z'),
    updatedAt: new Date('2024-01-10T00:00:00Z'),
    orders: [],
    preference: {} as any,
  };

  beforeEach(async () => {
    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    const repositoryMock: MockRepository<User> = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(queryBuilder as unknown as SelectQueryBuilder<User>),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(UserPreference),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user with a hashed password and trimmed display name', async () => {
      const dto: CreateUserDto = {
        username: 'john',
        password: 'securePass1',
        displayName: '  John Doe  ',
      };
      const hashedPassword = 'hashed-password';
      const savedUser: User = {
        id: 'f1cdb8a6-1e62-4d6f-b077-3e6bf6e5c09e',
        username: dto.username,
        displayName: 'John Doe',
        passwordHash: hashedPassword,
        role: 'user' as any,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2024-02-01T00:00:00Z'),
        orders: [],
        preference: {} as any,
      };

      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword as never);
      (usersRepository.create as jest.Mock).mockReturnValueOnce({
        username: dto.username,
        displayName: 'John Doe',
        passwordHash: hashedPassword,
      });
      (usersRepository.save as jest.Mock).mockResolvedValueOnce(savedUser);

      const result = await service.create(dto);

      expect(result).toEqual(savedUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: dto.username } });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        username: dto.username,
        displayName: 'John Doe',
        passwordHash: hashedPassword,
      });
      expect(usersRepository.save).toHaveBeenCalledWith({
        username: dto.username,
        displayName: 'John Doe',
        passwordHash: hashedPassword,
      });
    });

    it('should throw ConflictException when the username already exists', async () => {
      const dto: CreateUserDto = {
        username: 'john',
        password: 'securePass1',
      };
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(baseUser);

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow('Username already exists');
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return users ordered by createdAt DESC', async () => {
      const users = [
        { ...baseUser, id: 'user-1', createdAt: new Date('2024-02-01T00:00:00Z') },
        { ...baseUser, id: 'user-2', createdAt: new Date('2024-01-01T00:00:00Z') },
      ];
      (usersRepository.find as jest.Mock).mockResolvedValueOnce(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(usersRepository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('findOne', () => {
    it('should return the user when found', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(baseUser);

      const result = await service.findOne('user-123');

      expect(result).toEqual(baseUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-123' } });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      const promise = service.findOne('missing-id');

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('User not found');
    });
  });

  describe('findByUsername', () => {
    it('should return the user when it exists', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(baseUser);

      const result = await service.findByUsername('jane');

      expect(result).toEqual(baseUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: 'jane' } });
    });

    it('should return null when the user does not exist', async () => {
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.findByUsername('missing');

      expect(result).toBeNull();
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: 'missing' } });
    });
  });

  describe('findByUsernameWithPassword', () => {
    it('should use the query builder to include the password hash', async () => {
      queryBuilder.getOne!.mockResolvedValueOnce(baseUser);

      const result = await service.findByUsernameWithPassword('jane');

      expect(result).toEqual(baseUser);
      expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(queryBuilder.where).toHaveBeenCalledWith('user.username = :username', { username: 'jane' });
      expect(queryBuilder.getOne).toHaveBeenCalledTimes(1);
    });

    it('should return null when the user is not found', async () => {
      queryBuilder.getOne!.mockResolvedValueOnce(null);

      const result = await service.findByUsernameWithPassword('missing');

      expect(result).toBeNull();
      expect(queryBuilder.getOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update user fields and hash a new password', async () => {
      const existingUser: User = {
        ...baseUser,
        username: 'old-username',
      };
      queryBuilder.getOne!.mockResolvedValueOnce(existingUser);
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      const dto: UpdateUserDto = {
        username: 'new-username',
        displayName: 'New Display',
        isActive: false,
        password: 'newPassword!',
      };
      const newHash = 'new-hash';
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(newHash as never);

      const savedUser: User = {
        ...existingUser,
        username: dto.username!,
        displayName: dto.displayName!,
        isActive: dto.isActive!,
        passwordHash: newHash,
        lastLoginAt: existingUser.lastLoginAt,
      };
      (usersRepository.save as jest.Mock).mockResolvedValueOnce(savedUser);

      const result = await service.update(existingUser.id, dto);

      expect(result).toEqual(savedUser);
      expect(queryBuilder.where).toHaveBeenCalledWith('user.id = :id', { id: existingUser.id });
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: dto.username } });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        username: dto.username,
        displayName: dto.displayName,
        isActive: dto.isActive,
        passwordHash: newHash,
      }));
    });

    it('should throw ConflictException when the new username already exists', async () => {
      const existingUser: User = { ...baseUser, username: 'current-name' };
      queryBuilder.getOne!.mockResolvedValueOnce(existingUser);
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...existingUser, id: 'duplicate-id' });

      const promise = service.update(existingUser.id, { username: 'taken' });

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow('Username already exists');
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      queryBuilder.getOne!.mockResolvedValueOnce(null);

      const promise = service.update('missing-id', {});

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('User not found');
    });
  });
});
