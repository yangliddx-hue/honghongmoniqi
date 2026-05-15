'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// 用户类型
interface User {
  id: number;
  username: string;
}

// 上下文类型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取当前用户信息
  const refreshUser = useCallback(async () => {
    try {
      console.log('[AuthContext] 开始获取用户信息...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // 确保发送cookie
      });
      const data = await response.json();
      console.log('[AuthContext] 获取用户信息结果:', data);
      setUser(data.user);
    } catch (error) {
      console.error('[AuthContext] 获取用户信息失败:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // 确保发送cookie
      });
      setUser(null);
    } catch (error) {
      console.error('登出失败:', error);
    }
  }, []);

  // 初始化时获取用户信息
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
