'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Trophy, Calendar, Heart, Frown, Loader2 } from 'lucide-react';

interface GameRecord {
  id: number;
  scenario: string;
  final_score: string;
  result: string;
  played_at: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // 未登录用户重定向到登录页
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 获取游戏记录
  useEffect(() => {
    const fetchRecords = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/game/records', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setRecords(data.records || []);
        }
      } catch (err) {
        console.error('Failed to fetch records:', err);
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [user]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取结果颜色
  const getResultColor = (result: string) => {
    return result === '通关' ? 'text-green-500' : 'text-red-500';
  };

  // 获取好感度颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 用户信息卡片 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{user.username}</h1>
                <p className="text-gray-500">欢迎回来！继续挑战哄哄模拟器吧 💕</p>
              </div>
            </div>
          </div>

          {/* 游戏记录标题 */}
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-700">游戏记录</h2>
          </div>

          {/* 游戏记录列表 */}
          {loadingRecords ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
              <p className="text-gray-500 mt-2">加载中...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <p className="text-gray-500">还没有游戏记录，快去玩一局吧！</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:opacity-90 transition"
              >
                开始游戏
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {record.result === '通关' ? (
                          <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        ) : (
                          <Frown className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-800">{record.scenario}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(record.played_at)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getResultColor(record.result)}`}>
                        {record.result}
                      </div>
                      <div className={`text-sm ${getScoreColor(parseInt(record.final_score))}`}>
                        好感度: {record.final_score}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 统计信息 */}
          {records.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-pink-500">{records.length}</p>
                  <p className="text-sm text-gray-500">总场次</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {records.filter(r => r.result === '通关').length}
                  </p>
                  <p className="text-sm text-gray-500">通关次数</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">
                    {records.filter(r => r.result === '通关').length > 0
                      ? Math.round((records.filter(r => r.result === '通关').length / records.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">通关率</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
