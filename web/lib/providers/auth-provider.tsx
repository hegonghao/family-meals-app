'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getAuthToken,
  getUser,
  logout as authLogout,
  restoreUserFromToken,
  setUser as persistUser,
} from '../auth';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'accessToken';
const USER_STORAGE_KEY = 'user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncAuthState = useCallback(() => {
    if (typeof window === 'undefined') {
      setUserState(null);
      setHasToken(false);
      return;
    }

    const token = getAuthToken();
    const tokenExists = Boolean(token);
    setHasToken(tokenExists);

    if (!tokenExists) {
      setUserState(null);
      return;
    }

    const storedUser = getUser();
    if (storedUser) {
      setUserState(storedUser);
      return;
    }

    if (token) {
      const restored = restoreUserFromToken(token);
      if (restored) {
        setUserState(restored);
        persistUser(restored);
        return;
      }
    }

    setUserState(null);
  }, []);

  useEffect(() => {
    syncAuthState();
    setIsLoading(false);
  }, [syncAuthState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_STORAGE_KEY || event.key === USER_STORAGE_KEY) {
        syncAuthState();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncAuthState]);

  const handleSetUser = (nextUser: User | null) => {
    setUserState(nextUser);
    if (nextUser) {
      persistUser(nextUser);
    } else if (typeof window !== 'undefined') {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }

    setHasToken(Boolean(getAuthToken()));
  };

  const handleLogout = () => {
    setUserState(null);
    setHasToken(false);
    authLogout();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: hasToken && Boolean(user),
    setUser: handleSetUser,
    logout: handleLogout,
  };

  if (isLoading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
