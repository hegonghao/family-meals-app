import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Order, CreateOrderDto, UpdateOrderDto } from '../types';

interface CalendarRangeParams {
  start: string;
  end: string;
}

async function fetchCalendarRange(params: CalendarRangeParams): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>('/orders/calendar-range', { params });
  return data;
}

export function useCalendarOrders(start: string, end: string) {
  return useQuery({
    queryKey: ['orders', 'calendar-range', start, end],
    queryFn: () => fetchCalendarRange({ start, end }),
  });
}

async function cancelOrder(orderId: string): Promise<void> {
  await apiClient.post(`/orders/${orderId}/cancel`);
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: async () => {
      // 刷新所有相关查询
      await queryClient.invalidateQueries({ queryKey: ['orders'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'missing-meals'] });
    },
  });
}

async function createOrder(dto: CreateOrderDto): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', dto);
  return data;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'missing-meals'] });
    },
  });
}

async function updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}`, dto);
  return data;
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOrderDto }) => updateOrder(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'missing-meals'] });
    },
  });
}

async function fetchOrderById(id: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
  });
}
