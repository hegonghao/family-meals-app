import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { MealSlot } from '../common/enums/meal-slot.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Dish } from '../menu/entities/dish.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

type MockRepository<T extends ObjectLiteral = any> = Partial<jest.Mocked<Repository<T>>>;
type MockQueryBuilder<T extends ObjectLiteral = any> = Partial<jest.Mocked<SelectQueryBuilder<T>>>;

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: MockRepository<Order>;
  let orderItemsRepository: MockRepository<OrderItem>;
  let dishRepository: MockRepository<Dish>;
  let usersRepository: MockRepository<User>;
  let ordersQueryBuilder: MockQueryBuilder<Order>;

  const USER_ID = '4db3a6ee-2a30-4d97-8efc-9968436d3f11';
  const OTHER_USER_ID = 'c2f1d3c8-1df7-4f61-9f4c-934e2cedb019';
  const DISH_ID = '5a1def4f-3f34-4f7d-b60d-ff1215f85f2c';
  const SECOND_DISH_ID = 'e2f88db4-304d-45dd-8e6d-26e2152fcb8c';
  const ORDER_ID = '2ac1a58d-df0f-4a18-8e2f-bc350ad4b4b6';
  const FUTURE_DATE = '2099-12-25';
  const ANOTHER_FUTURE_DATE = '2099-12-26';
  const PAST_DATE = '2000-01-01';

  const baseUser: User = {
    id: USER_ID,
    username: 'family_chef',
    displayName: 'Family Chef',
    passwordHash: 'hashed-password',
    role: 'user' as any,
    isActive: true,
    lastLoginAt: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    orders: [],
    preference: {} as any,
  };

  const baseDish: Dish = {
    id: DISH_ID,
    name: 'Veggie Pasta',
    slot: MealSlot.LUNCH,
    isActive: true,
    orderItems: [],
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-05T00:00:00Z'),
  };

  const createOrder = (overrides: Partial<Order> = {}): Order => ({
    id: overrides.id ?? ORDER_ID,
    user: overrides.user ?? { ...baseUser, orders: [] },
    mealDate: overrides.mealDate ?? FUTURE_DATE,
    slot: overrides.slot ?? MealSlot.LUNCH,
    status: overrides.status ?? OrderStatus.PENDING,
    notes: overrides.notes ?? null,
    items: overrides.items ?? [],
    createdAt: overrides.createdAt ?? new Date('2024-03-01T00:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2024-03-01T00:00:00Z'),
  });

  beforeEach(async () => {
    ordersQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };

    const ordersRepositoryMock: MockRepository<Order> = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(ordersQueryBuilder as unknown as SelectQueryBuilder<Order>),
    };
    const orderItemsRepositoryMock: MockRepository<OrderItem> = {
      create: jest.fn(),
    };
    const dishRepositoryMock: MockRepository<Dish> = {
      findOne: jest.fn(),
    };
    const usersRepositoryMock: MockRepository<User> = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: ordersRepositoryMock },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemsRepositoryMock },
        { provide: getRepositoryToken(Dish), useValue: dishRepositoryMock },
        { provide: getRepositoryToken(User), useValue: usersRepositoryMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersRepository = module.get<MockRepository<Order>>(getRepositoryToken(Order));
    orderItemsRepository = module.get<MockRepository<OrderItem>>(getRepositoryToken(OrderItem));
    dishRepository = module.get<MockRepository<Dish>>(getRepositoryToken(Dish));
    usersRepository = module.get<MockRepository<User>>(getRepositoryToken(User));

    (orderItemsRepository.create as jest.Mock).mockImplementation(
      (item: Partial<OrderItem>) =>
        ({
          ...item,
        } as OrderItem),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      const user = { ...baseUser, orders: [] };
      const firstDish = { ...baseDish };
      const secondDish = { ...baseDish, id: SECOND_DISH_ID, name: 'Garden Salad' };
      const dto: CreateOrderDto = {
        userId: user.id,
        mealDate: FUTURE_DATE,
        slot: MealSlot.LUNCH,
        notes: 'No onions',
        items: [
          { dishId: firstDish.id, quantity: 2, specialInstruction: 'Extra spicy' },
          { dishId: secondDish.id, quantity: 1 },
        ],
      };

      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(user);
      (dishRepository.findOne as jest.Mock).mockResolvedValueOnce(firstDish).mockResolvedValueOnce(secondDish);
      (ordersRepository.create as jest.Mock).mockImplementation((order) => order);
      (ordersRepository.save as jest.Mock).mockImplementation(async (order) => ({
        ...order,
        id: ORDER_ID,
      }));

      const result = await service.create(dto);

      expect(result).toMatchObject({
        id: ORDER_ID,
        user,
        mealDate: dto.mealDate,
        slot: dto.slot,
        notes: dto.notes,
        status: OrderStatus.PENDING,
      });
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.userId } });
      expect(dishRepository.findOne).toHaveBeenNthCalledWith(1, { where: { id: dto.items[0].dishId } });
      expect(dishRepository.findOne).toHaveBeenNthCalledWith(2, { where: { id: dto.items[1].dishId } });
      expect(ordersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          mealDate: dto.mealDate,
          slot: dto.slot,
          notes: dto.notes,
          status: OrderStatus.PENDING,
        }),
      );
      const createdItems = (ordersRepository.create as jest.Mock).mock.calls[0][0].items as OrderItem[];
      expect(createdItems).toHaveLength(2);
      expect(createdItems[0]).toMatchObject({
        dish: firstDish,
        dishName: firstDish.name,
        quantity: 2,
        specialInstruction: 'Extra spicy',
      });
      expect(createdItems[1]).toMatchObject({
        dish: secondDish,
        dishName: secondDish.name,
        quantity: 1,
      });
      expect(ordersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          items: expect.any(Array),
        }),
      );
      expect(ordersRepository.createQueryBuilder).toHaveBeenCalledWith('order');
      expect(ordersQueryBuilder.where).toHaveBeenCalledWith('order.userId = :userId', { userId: user.id });
      expect(ordersQueryBuilder.andWhere).toHaveBeenCalledWith('dish.id IN (:...dishIds)', {
        dishIds: [firstDish.id, secondDish.id],
      });
      expect(ordersQueryBuilder.getCount).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid meal date format', async () => {
      const dto: CreateOrderDto = {
        userId: USER_ID,
        mealDate: 'invalid-date',
        slot: MealSlot.LUNCH,
        items: [{ dishId: DISH_ID, quantity: 1 }],
      };

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Invalid meal date format');
      expect(usersRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when meal date has passed', async () => {
      const dto: CreateOrderDto = {
        userId: USER_ID,
        mealDate: PAST_DATE,
        slot: MealSlot.LUNCH,
        items: [{ dishId: DISH_ID, quantity: 1 }],
      };

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Meal date has already passed');
      expect(usersRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const dto: CreateOrderDto = {
        userId: USER_ID,
        mealDate: FUTURE_DATE,
        slot: MealSlot.LUNCH,
        items: [{ dishId: DISH_ID, quantity: 1 }],
      };
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('User not found');
      expect(dishRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when dish is not found', async () => {
      const dto: CreateOrderDto = {
        userId: USER_ID,
        mealDate: FUTURE_DATE,
        slot: MealSlot.LUNCH,
        items: [{ dishId: DISH_ID, quantity: 1 }],
      };
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...baseUser });
      (dishRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Dish not found or inactive');
    });

    it('should throw NotFoundException when dish is inactive', async () => {
      const dto: CreateOrderDto = {
        userId: USER_ID,
        mealDate: FUTURE_DATE,
        slot: MealSlot.LUNCH,
        items: [{ dishId: DISH_ID, quantity: 1 }],
      };
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...baseUser });
      (dishRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...baseDish, isActive: false });

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Dish not found or inactive');
    });

    it('should throw BadRequestException when dish slot does not match order slot', async () => {
      const dto: CreateOrderDto = {
        userId: USER_ID,
        mealDate: FUTURE_DATE,
        slot: MealSlot.DINNER,
        items: [{ dishId: DISH_ID, quantity: 1 }],
      };
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...baseUser });
      (dishRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...baseDish, slot: MealSlot.BREAKFAST });

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Meal slot does not match dish');
      expect(orderItemsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for duplicate dishes within one order', async () => {
      const dto: CreateOrderDto = {
        userId: USER_ID,
        mealDate: FUTURE_DATE,
        slot: MealSlot.LUNCH,
        items: [
          { dishId: DISH_ID, quantity: 1 },
          { dishId: DISH_ID, quantity: 2 },
        ],
      };
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...baseUser });
      (dishRepository.findOne as jest.Mock).mockResolvedValue({ ...baseDish });

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Duplicate dishes within the same order');
      expect(ordersRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when dish selection is not unique for the user', async () => {
      const dto: CreateOrderDto = {
        userId: USER_ID,
        mealDate: FUTURE_DATE,
        slot: MealSlot.LUNCH,
        items: [{ dishId: DISH_ID, quantity: 1 }],
      };
      (usersRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...baseUser });
      (dishRepository.findOne as jest.Mock).mockResolvedValueOnce({ ...baseDish });
      ordersQueryBuilder.getCount!.mockResolvedValueOnce(1);

      const promise = service.create(dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Dish already ordered for this user and meal');
      expect(ordersRepository.createQueryBuilder).toHaveBeenCalledWith('order');
    });
  });

  describe('findUpcoming', () => {
    it('should return orders from today onwards', async () => {
      const orders = [createOrder({ id: 'order-1' })];
      (ordersRepository.find as jest.Mock).mockResolvedValueOnce(orders);

      const result = await service.findUpcoming();

      expect(result).toEqual(orders);
      expect(ordersRepository.find).toHaveBeenCalledTimes(1);
      const callArgs = (ordersRepository.find as jest.Mock).mock.calls[0][0];
      expect(callArgs.order).toEqual({ mealDate: 'ASC', slot: 'ASC', createdAt: 'DESC' });
      const expectedDate = new Date().toISOString().slice(0, 10);
      expect((callArgs.where.mealDate as any).value).toBe(expectedDate);
    });
  });

  describe('findByRange', () => {
    it('should return orders within date range', async () => {
      const start = '2099-01-01';
      const end = '2099-01-31';
      const orders = [createOrder({ mealDate: start })];
      (ordersRepository.find as jest.Mock).mockResolvedValueOnce(orders);

      const result = await service.findByRange(start, end);

      expect(result).toEqual(orders);
      const callArgs = (ordersRepository.find as jest.Mock).mock.calls[0][0];
      expect((callArgs.where.mealDate as any).value).toEqual([start, end]);
      expect(callArgs.where.slot).toBeUndefined();
    });

    it('should apply slot filter when provided', async () => {
      const start = '2099-02-01';
      const end = '2099-02-28';
      const orders = [createOrder({ mealDate: start, slot: MealSlot.DINNER })];
      (ordersRepository.find as jest.Mock).mockResolvedValueOnce(orders);

      await service.findByRange(start, end, MealSlot.DINNER);

      const callArgs = (ordersRepository.find as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.slot).toBe(MealSlot.DINNER);
    });
  });

  describe('findByDate', () => {
    it('should return orders for date only filter', async () => {
      const date = '2099-03-10';
      const orders = [createOrder({ mealDate: date })];
      (ordersRepository.find as jest.Mock).mockResolvedValueOnce(orders);

      const result = await service.findByDate(date);

      expect(result).toEqual(orders);
      const callArgs = (ordersRepository.find as jest.Mock).mock.calls[0][0];
      expect(callArgs.where).toEqual({ mealDate: date });
    });

    it('should apply slot and user filters when provided', async () => {
      const date = '2099-03-11';
      (ordersRepository.find as jest.Mock).mockResolvedValueOnce([]);

      await service.findByDate(date, MealSlot.BREAKFAST, USER_ID);

      const callArgs = (ordersRepository.find as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.slot).toBe(MealSlot.BREAKFAST);
      expect(callArgs.where.user).toEqual({ id: USER_ID });
    });
  });

  describe('findOne', () => {
    it('should return order when found and owned by user', async () => {
      const order = createOrder();
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.findOne(order.id, USER_ID);

      expect(result).toEqual(order);
      expect(ordersRepository.findOne).toHaveBeenCalledWith({
        where: { id: order.id },
        relations: ['items', 'items.dish', 'user'],
      });
    });

    it('should throw NotFoundException when order missing', async () => {
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      const promise = service.findOne(ORDER_ID);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Order not found');
    });

    it('should throw ForbiddenException when requester is not owner', async () => {
      const order = createOrder({ user: { ...baseUser, id: USER_ID } });
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(order);

      const promise = service.findOne(order.id, OTHER_USER_ID);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toThrow('You do not have permission to modify this order');
    });
  });

  describe('update', () => {
    it('should update order fields and items', async () => {
      const existingOrder = createOrder({
        user: { ...baseUser, orders: [] },
        items: [
          {
            id: 'item-1',
            dish: { ...baseDish },
            dishName: baseDish.name,
            quantity: 1,
            specialInstruction: null,
          } as OrderItem,
        ],
      });
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(existingOrder);
      (ordersRepository.save as jest.Mock).mockImplementation(async (order) => order);
      const dinnerDish = { ...baseDish, id: DISH_ID, slot: MealSlot.DINNER, name: 'Roasted Chicken' };
      (dishRepository.findOne as jest.Mock).mockResolvedValueOnce(dinnerDish);
      const dto: UpdateOrderDto = {
        mealDate: ANOTHER_FUTURE_DATE,
        slot: MealSlot.DINNER,
        notes: 'Updated note',
        status: OrderStatus.CONFIRMED,
        items: [
          {
            dishId: dinnerDish.id,
            quantity: 3,
            specialInstruction: 'Less salt',
          },
        ],
      };

      const result = await service.update(existingOrder.id, dto, USER_ID);

      expect(result).toMatchObject({
        mealDate: dto.mealDate,
        slot: dto.slot,
        notes: dto.notes,
        status: dto.status,
      });
      expect(dishRepository.findOne).toHaveBeenCalledWith({ where: { id: dinnerDish.id } });
      expect(orderItemsRepository.create).toHaveBeenCalledWith({
        dish: dinnerDish,
        dishName: dinnerDish.name,
        quantity: 3,
        specialInstruction: 'Less salt',
      });
      expect(ordersRepository.createQueryBuilder).toHaveBeenCalledWith('order');
      expect(ordersQueryBuilder.andWhere).toHaveBeenCalledWith('dish.id IN (:...dishIds)', {
        dishIds: [dinnerDish.id],
      });
      expect(ordersQueryBuilder.andWhere).toHaveBeenCalledWith('order.id != :excludeOrderId', {
        excludeOrderId: existingOrder.id,
      });
      expect(ordersQueryBuilder.getCount).toHaveBeenCalled();
      expect(ordersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              dish: dinnerDish,
              quantity: 3,
              specialInstruction: 'Less salt',
            }),
          ]),
        }),
      );
    });

    it('should throw BadRequestException when new meal date is in the past', async () => {
      const existingOrder = createOrder();
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(existingOrder);

      const promise = service.update(existingOrder.id, { mealDate: PAST_DATE }, USER_ID);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Meal date has already passed');
      expect(ordersRepository.save).not.toHaveBeenCalled();
    });

    it('should enforce ownership during update', async () => {
      const existingOrder = createOrder({ user: { ...baseUser, id: USER_ID } });
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(existingOrder);

      const promise = service.update(existingOrder.id, {}, OTHER_USER_ID);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toThrow('You do not have permission to modify this order');
      expect(ordersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel an order successfully', async () => {
      const order = createOrder({ status: OrderStatus.CONFIRMED });
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(order);
      (ordersRepository.save as jest.Mock).mockImplementation(async (input) => input);

      const result = await service.cancel(order.id, USER_ID);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(ordersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.CANCELLED }),
      );
    });

    it('should prevent cancelling past orders', async () => {
      const pastOrder = createOrder({ mealDate: PAST_DATE });
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(pastOrder);

      const promise = service.cancel(pastOrder.id, USER_ID);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('Meal date has already passed');
      expect(ordersRepository.save).not.toHaveBeenCalled();
    });

    it('should enforce ownership when cancelling', async () => {
      const order = createOrder({ user: { ...baseUser, id: USER_ID } });
      (ordersRepository.findOne as jest.Mock).mockResolvedValueOnce(order);

      const promise = service.cancel(order.id, OTHER_USER_ID);

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toThrow('You do not have permission to modify this order');
      expect(ordersRepository.save).not.toHaveBeenCalled();
    });
  });
});
