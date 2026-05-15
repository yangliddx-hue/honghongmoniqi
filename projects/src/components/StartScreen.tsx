'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Users, MapPin, BookOpen, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';
import {
  SCENARIOS,
  VOICE_CONFIG,
  getVoicesByGender,
} from '@/types/game';

export function StartScreen() {
  const { gameState, setGender, setScenario, setVoiceType, startGame } = useGame();
  const { gender, scenario, voiceType } = gameState;

  // 获取适用的语音列表
  const availableVoices = gender ? getVoicesByGender(gender) : [];

  // 检查是否可以开始游戏
  const canStart = gender && scenario && voiceType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-4">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">哄哄模拟器</h1>
          <p className="text-gray-500">用你的智慧和真诚，在10轮内把对方哄好！</p>
        </div>

        {/* 配置卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* 性别选择 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Users className="w-4 h-4" />
              选择对方性别
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={gender === 'female' ? 'default' : 'outline'}
                onClick={() => {
                  setGender('female');
                  setVoiceType(null); // 重置语音选择
                }}
                className={
                  gender === 'female'
                    ? 'bg-pink-500 hover:bg-pink-600'
                    : ''
                }
              >
                女生
              </Button>
              <Button
                variant={gender === 'male' ? 'default' : 'outline'}
                onClick={() => {
                  setGender('male');
                  setVoiceType(null); // 重置语音选择
                }}
                className={
                  gender === 'male'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : ''
                }
              >
                男生
              </Button>
            </div>
          </div>

          {/* 场景选择 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <MapPin className="w-4 h-4" />
              选择场景
            </label>
            <div className="space-y-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScenario(s)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    scenario?.id === s.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                  }`}
                >
                  <div className="font-medium text-gray-800">{s.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 语音选择 */}
          {gender && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <span>选择声音</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {availableVoices.map((voice) => (
                  <Button
                    key={voice}
                    variant={voiceType === voice ? 'default' : 'outline'}
                    onClick={() => setVoiceType(voice)}
                    className={
                      voiceType === voice
                        ? 'bg-purple-500 hover:bg-purple-600 justify-start'
                        : 'justify-start'
                    }
                  >
                    {VOICE_CONFIG[voice].label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 开始按钮 */}
          <Button
            onClick={startGame}
            disabled={!canStart}
            className={`w-full h-12 text-lg font-medium transition-all ${
              canStart
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            开始游戏
          </Button>
        </div>

        {/* 底部入口 */}
        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-gray-400">
            选择性别和场景后点击开始
          </p>
          
          {/* 排行榜和恋爱攻略入口 */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <Link href="/leaderboard" className="block">
              <Button
                variant="outline"
                className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
              >
                <Trophy className="w-4 h-4" />
                排行榜
              </Button>
            </Link>
            <Link href="/blog" className="block">
              <Button
                variant="outline"
                className="w-full gap-2 text-pink-600 border-pink-200 hover:bg-pink-50 hover:border-pink-300"
              >
                <BookOpen className="w-4 h-4" />
                恋爱攻略
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
