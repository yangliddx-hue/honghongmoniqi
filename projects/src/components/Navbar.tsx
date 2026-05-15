'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">💕</span>
          <span className="font-bold text-lg text-pink-600">哄哄模拟器</span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-8 bg-gray-100 animate-pulse rounded-lg" />
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>退出</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
