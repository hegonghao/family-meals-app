import { apiClient } from './client';
import type { User } from '../types';

export interface CreateUserDto {
  username: string;
  displayName?: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserDto {
  username?: string;
  displayName?: string;
  password?: string;
  isActive?: boolean;
  role?: 'admin' | 'user';
}

export interface UpdateProfileDto {
  displayName?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Create a new user (admin only)
export async function createUser(dto: CreateUserDto): Promise<User> {
  const { data } = await apiClient.post<User>('/users', dto);
  return data;
}

// Fetch all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users');
  return data;
}

// Update personal profile (current user)
export async function updateOwnProfile(dto: UpdateProfileDto): Promise<User> {
  const { data } = await apiClient.patch<User>('/users/me', dto);
  return data;
}

// Update user (admin only)
export async function updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
  const { data } = await apiClient.patch<User>(`/users/${userId}`, dto);
  return data;
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/users/${userId}`);
  return data;
}

