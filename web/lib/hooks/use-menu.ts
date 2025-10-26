import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Dish, CreateDishDto, UpdateDishDto, MealSlot } from '../types';

// 获取所有菜品（包括未启用的）
async function fetchDishes(): Promise<Dish[]> {
  const { data } = await apiClient.get<Dish[]>('/menu/dishes', {
    params: { includeInactive: true }
  });
  return data;
}

// 获取指定餐次的菜品
async function fetchDishesBySlot(slot: MealSlot): Promise<Dish[]> {
  const { data } = await apiClient.get<Dish[]>(`/menu/slots/${slot}`);
  return data;
}

// 创建菜品
async function createDish(dto: CreateDishDto): Promise<Dish> {
  const { data } = await apiClient.post<Dish>('/menu/dishes', dto);
  return data;
}

// 更新菜品
async function updateDish(id: string, dto: UpdateDishDto): Promise<Dish> {
  const { data } = await apiClient.patch<Dish>(`/menu/dishes/${id}`, dto);
  return data;
}

// 删除菜品
async function deleteDish(id: string): Promise<void> {
  await apiClient.delete(`/menu/dishes/${id}`);
}

export function useDishes() {
  return useQuery({
    queryKey: ['menu', 'dishes'],
    queryFn: fetchDishes,
  });
}

export function useDishesBySlot(slot: MealSlot) {
  return useQuery({
    queryKey: ['menu', 'dishes', slot],
    queryFn: () => fetchDishesBySlot(slot),
  });
}

export function useCreateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'], exact: false });
    },
  });
}

export function useUpdateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDishDto }) => updateDish(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'], exact: false });
    },
  });
}

export function useDeleteDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'], exact: false });
    },
  });
}
