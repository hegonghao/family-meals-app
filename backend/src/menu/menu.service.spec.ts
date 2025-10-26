import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MenuService } from './menu.service';
import { Dish } from './entities/dish.entity';
import { MealSlot } from '../common/enums/meal-slot.enum';

describe('MenuService', () => {
  let service: MenuService;
  let repository: Repository<Dish>;

  const mockDish = {
    id: 'dish-123',
    name: 'Test Dish',
    slot: MealSlot.BREAKFAST,
    isActive: true,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: getRepositoryToken(Dish),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    repository = module.get<Repository<Dish>>(getRepositoryToken(Dish));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDish', () => {
    it('should create and return a new dish', async () => {
      const createDishDto = {
        name: 'New Dish',
        slot: MealSlot.LUNCH,
        isActive: true,
      };

      mockRepository.create.mockReturnValue(mockDish);
      mockRepository.save.mockResolvedValue(mockDish);

      const result = await service.createDish(createDishDto);

      expect(result).toEqual(mockDish);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: createDishDto.name,
        slot: createDishDto.slot,
        isActive: createDishDto.isActive,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockDish);
    });

    it('should default isActive to true if not provided', async () => {
      const createDishDto = {
        name: 'New Dish',
        slot: MealSlot.DINNER,
      };

      mockRepository.create.mockReturnValue(mockDish);
      mockRepository.save.mockResolvedValue(mockDish);

      await service.createDish(createDishDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: createDishDto.name,
        slot: createDishDto.slot,
        isActive: true,
      });
    });
  });

  describe('findAllDishes', () => {
    it('should return all active dishes', async () => {
      const dishes = [mockDish];
      mockRepository.find.mockResolvedValue(dishes);

      const result = await service.findAllDishes();

      expect(result).toEqual(dishes);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { slot: 'ASC', name: 'ASC' },
      });
    });

    it('should filter by slot when provided', async () => {
      const dishes = [mockDish];
      mockRepository.find.mockResolvedValue(dishes);

      await service.findAllDishes(MealSlot.BREAKFAST);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { slot: MealSlot.BREAKFAST, isActive: true },
        order: { slot: 'ASC', name: 'ASC' },
      });
    });

    it('should include inactive dishes when includeInactive is true', async () => {
      const dishes = [mockDish];
      mockRepository.find.mockResolvedValue(dishes);

      await service.findAllDishes(undefined, true);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { slot: 'ASC', name: 'ASC' },
      });
    });
  });

  describe('updateDish', () => {
    it('should update and return the dish', async () => {
      const updateDto = {
        name: 'Updated Dish',
        isActive: false,
      };

      mockRepository.findOne.mockResolvedValue(mockDish);
      mockRepository.save.mockResolvedValue({ ...mockDish, ...updateDto });

      const result = await service.updateDish('dish-123', updateDto);

      expect(result).toEqual({ ...mockDish, ...updateDto });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'dish-123' } });
    });

    it('should throw NotFoundException if dish not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateDish('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateDish('nonexistent', { name: 'Test' })).rejects.toThrow(
        'Dish not found',
      );
    });
  });

  describe('getMenuBySlot', () => {
    it('should return active dishes for the specified slot', async () => {
      const dishes = [mockDish];
      mockRepository.find.mockResolvedValue(dishes);

      const result = await service.getMenuBySlot(MealSlot.BREAKFAST);

      expect(result).toEqual(dishes);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { slot: MealSlot.BREAKFAST, isActive: true },
        order: { name: 'ASC' },
      });
    });
  });
});
