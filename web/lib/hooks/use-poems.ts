import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Poem } from '../types';

interface PoemsResponse {
  data: Poem[];
  total: number;
}

async function fetchRandomPoem(): Promise<Poem | null> {
  const response = await apiClient.get<PoemsResponse>('/poems');
  const poems = response.data.data;

  if (!poems || poems.length === 0) {
    return null;
  }

  // 随机选择一首诗
  return poems[Math.floor(Math.random() * poems.length)];
}

export function useRandomPoem() {
  return useQuery({
    queryKey: ['poems', 'random'],
    queryFn: fetchRandomPoem,
    staleTime: 24 * 60 * 60 * 1000, // 24小时
    refetchOnWindowFocus: false,
  });
}
