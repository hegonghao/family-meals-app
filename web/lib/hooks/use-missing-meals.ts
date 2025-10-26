import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { MissingMealsResponse } from '../types';

async function fetchMissingMeals(): Promise<MissingMealsResponse> {
  const { data } = await apiClient.get<MissingMealsResponse>('/dashboard/missing-meals');
  return data;
}

export function useMissingMeals() {
  return useQuery({
    queryKey: ['dashboard', 'missing-meals'],
    queryFn: fetchMissingMeals,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
