'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft, Crown, Medal, MedalIcon as Medal2, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  final_score: number;
  played_at: string;
  is_current_user: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUserId: number | null;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('获取排行榜失败');
      }

      const result = await response.json();
      console.log('[leaderboard] 获取数据:', result);
      setData(result);
    } catch (err) {
      console.error('[leaderboard] 错误:', err);
      setError('加载排行榜失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal2 className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-500">加载排行榜中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 pt-20">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchLeaderboard}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 pt-20 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">排行榜</h1>
                <p className="text-sm text-gray-500">TOP 20 最高好感度</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Button>
            </Link>
          </div>
        </div>

        {/* 排行榜列表 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {data?.leaderboard && data.leaderboard.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {data.leaderboard.map((entry) => (
                <div
                  key={`${entry.user_id}-${entry.played_at}`}
                  className={`flex items-center p-4 ${
                    entry.is_current_user ? 'bg-amber-50 border-l-4 border-amber-400' : ''
                  }`}
                >
                  {/* 排名 */}
                  <div className="w-12 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 truncate">
                        {entry.username}
                      </span>
                      {entry.is_current_user && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <User className="w-3 h-3 mr-1" />
                          我
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(entry.played_at)}
                    </div>
                  </div>

                  {/* 分数 */}
                  <div className="flex items-center gap-2">
                    <Star className={`w-5 h-5 ${getScoreColor(entry.final_score)}`} />
                    <span className={`text-xl font-bold ${getScoreColor(entry.final_score)}`}>
                      {entry.final_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无排行榜数据</p>
              <p className="text-sm mt-2">登录后玩游戏即可上榜！</p>
            </div>
          )}
        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 只有登录用户的成绩才会上榜</p>
          <p>🏆 排名按最高好感度分数排序</p>
        </div>
      </div>
    </div>
  );
}
