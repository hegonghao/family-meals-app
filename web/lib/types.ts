// 从mobile复用的类型定义

export type MealSlot = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  remindersEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Dish {
  id: string;
  name: string;
  slot: MealSlot;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  quantity: number;
  dishName: string;
  dish?: Dish | null;
  specialInstruction?: string | null;
}

export interface Order {
  id: string;
  mealDate: string;
  slot: MealSlot;
  status: OrderStatus;
  notes?: string | null;
  items: OrderItem[];
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Poem {
  id: string;
  text: string;
  category: string;
  weight: number;
}

export interface MissingMealsResponse {
  targetDate: string;
  missingSlots: MealSlot[];
  allOrdered: boolean;
}

// 请求payload类型
export interface CreateOrderDto {
  userId: string;
  mealDate: string;
  slot: MealSlot;
  notes?: string;
  items: {
    dishId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderDto {
  mealDate?: string;
  slot?: MealSlot;
  notes?: string;
  items?: {
    dishId: string;
    quantity: number;
  }[];
}

export interface CreateDishDto {
  name: string;
  slot: MealSlot;
  isActive?: boolean;
}

export interface UpdateDishDto {
  name?: string;
  slot?: MealSlot;
  isActive?: boolean;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
