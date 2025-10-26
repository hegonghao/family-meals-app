import { apiClient } from './api/client';
import type { LoginDto, LoginResponse, User, UserRole } from './types';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_STORAGE_KEY = 'user';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

type TokenPayload = {
  sub?: string;
  username?: string;
  displayName?: string;
  role?: UserRole;
};

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') {
    return;
  }
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${name}=; path=/; max-age=0`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|;\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function decodeJwtPayload(token: string): TokenPayload | null {
  const [, payloadSegment] = token.split('.');
  if (!payloadSegment) {
    return null;
  }
  try {
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : typeof Buffer !== 'undefined'
          ? Buffer.from(padded, 'base64').toString('utf-8')
          : '';
    if (!json) {
      return null;
    }
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  setCookie(ACCESS_TOKEN_KEY, token, COOKIE_MAX_AGE);
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (stored) {
    return stored;
  }
  return readCookie(ACCESS_TOKEN_KEY);
}

export function setUser(user: User) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const userStr = localStorage.getItem(USER_STORAGE_KEY);
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function restoreUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.sub || !payload.username) {
    return null;
  }
  return {
    id: payload.sub,
    username: payload.username,
    displayName: payload.displayName ?? payload.username,
    role: payload.role ?? 'user',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    lastLoginAt: null,
  };
}

export function clearAuth() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  deleteCookie(ACCESS_TOKEN_KEY);
}

export async function login(dto: LoginDto): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', dto);
  setAuthToken(data.accessToken);
  setUser(data.user);
  return data;
}

export function logout() {
  clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
