'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Heart, Frown, Share2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { VOICE_CONFIG } from '@/types/game';

interface ConfettiItem {
  id: number;
  left: number;
  delay: number;
  duration: number;
  emoji: string;
}

// 生成撒花元素
function generateConfetti(): ConfettiItem[] {
  const emojis = ['🎉', '🎊', '✨', '🌸', '💖'];
  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
  }));
}

export function GameOverScreen() {
  const { gameState, resetGame } = useGame();
  const { user } = useAuth();
  const { won, messages, voiceType, affection, scenario } = gameState;

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recordSaved, setRecordSaved] = useState(false);
  const [showRecordTip, setShowRecordTip] = useState(false);
  const hasSavedRef = useRef(false); // 防止重复保存

  // 使用 useMemo 生成撒花元素
  const confettiItems = useMemo(() => generateConfetti(), []);

  // 获取最后一条消息作为结束语
  const lastMessage = messages[messages.length - 1];
  const endingMessage = won
    ? '好吧...这次就原谅你了，下次不许再犯了！'
    : '我真的太失望了，我们先冷静一下吧。';

  // 胜利时显示撒花动画
  useEffect(() => {
    if (won) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [won]);

  // 保存游戏记录
  useEffect(() => {
    const saveGameRecord = async () => {
      console.log('[game-records][CALL API] useEffect triggered', {
        hasSaved: hasSavedRef.current,
        user: user ? { id: user.id, username: user.username } : null,
        scenario: scenario?.title,
        affection,
        won,
        timestamp: Date.now(),
      });
      
      // 使用 useRef 防止重复保存（StrictMode会执行两次useEffect）
      if (hasSavedRef.current) {
        console.log('[game-records] skip duplicate save');
        return;
      }
      
      hasSavedRef.current = true;
      
      if (user) {
        // 已登录用户，保存记录
        try {
          console.log('[game-record] saving record', {
            scenario: scenario?.title || '哄哄模拟器',
            final_score: affection,
            result: won ? 'win' : 'lose',
          });
          
          const response = await fetch('/api/game/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              scenario: scenario?.title || '哄哄模拟器',
              final_score: affection,
              result: won ? 'win' : 'lose',
            }),
          });

          if (response.ok) {
            setRecordSaved(true);
            setShowRecordTip(true);
            setTimeout(() => setShowRecordTip(false), 3000);
            console.log('[game-record] save success');
          } else {
            hasSavedRef.current = false; // 保存失败，允许重试
            console.error('[game-record] save failed:', response.status);
          }
        } catch (err) {
          hasSavedRef.current = false; // 保存失败，允许重试
          console.error('[game-record] save error:', err);
        }
      } else {
        // 未登录用户，提示登录
        setShowRecordTip(true);
        console.log('[game-record] user not logged in');
      }
    };

    saveGameRecord();
  }, [user, scenario, affection, won]);

  // 生成结束语音
  useEffect(() => {
    const generateAudio = async () => {
      if (!voiceType) return;

      try {
        const speaker = VOICE_CONFIG[voiceType]?.speaker;
        if (!speaker) return;

        // 清理文本中的括号
        const cleanText = (lastMessage?.content || endingMessage)
          .replace(/（[^）]*）/g, '')
          .replace(/\([^)]*\)/g, '')
          .replace(/\[[^\]]*\]/g, '')
          .replace(/[「」『』]/g, '')
          .trim();

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            speaker,
            uid: `game-over-${Date.now()}`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAudioUri(data.audioUri);
        }
      } catch (err) {
        console.error('Failed to generate audio:', err);
      }
    };

    generateAudio();
  }, [voiceType, lastMessage, endingMessage]);

  // 播放语音
  const playAudio = () => {
    if (!audioUri) return;

    const audio = new Audio(audioUri);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play();
  };

  // 分享
  const handleShare = async () => {
    const text = won
      ? '我在哄哄模拟器中成功哄好了我的对象！你也来试试吧！'
      : '我在哄哄模拟器中失败了...你也来挑战一下？';

    if (navigator.share) {
      try {
        await navigator.share({
          title: '哄哄模拟器',
          text,
          url: window.location.href,
        });
      } catch {
        // 用户取消分享
      }
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(text + ' ' + window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
      {/* 撒花动画 */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {confettiItems.map((item) => (
            <div
              key={item.id}
              className="absolute animate-bounce"
              style={{
                left: `${item.left}%`,
                top: '-20px',
                animationDelay: `${item.delay}s`,
                animationDuration: `${item.duration}s`,
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-md">
        {/* 结果卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* 图标 */}
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
              won ? 'bg-pink-100' : 'bg-gray-100'
            }`}
          >
            {won ? (
              <Heart className="w-10 h-10 text-pink-500 fill-pink-500" />
            ) : (
              <Frown className="w-10 h-10 text-gray-400" />
            )}
          </div>

          {/* 标题 */}
          <h1 className={`text-2xl font-bold mb-2 ${won ? 'text-pink-500' : 'text-gray-500'}`}>
            {won ? '恭喜通关！' : '游戏结束'}
          </h1>

          {/* 副标题 */}
          <p className="text-gray-500 mb-6">
            {won
              ? '你成功哄好了对方！继续保持哦～'
              : '好感度太低，需要再接再厉'}
          </p>

          {/* 结束语气泡 */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">
              {lastMessage?.content || endingMessage}
            </p>
            {audioUri && (
              <button
                onClick={playAudio}
                className="mt-2 text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1 mx-auto"
              >
                {isPlaying ? '🔇' : '🔊'}
                <span>{isPlaying ? '停止' : '播放语音'}</span>
              </button>
            )}
          </div>

          {/* 统计信息 */}
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <div>
              <span className="text-gray-500">最终好感度</span>
              <p className={`font-bold ${affection >= 80 ? 'text-green-500' : affection < 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                {affection}
              </p>
            </div>
            <div>
              <span className="text-gray-500">游戏结果</span>
              <p className={`font-bold ${won ? 'text-green-500' : 'text-red-500'}`}>
                {won ? '胜利' : '失败'}
              </p>
            </div>
          </div>

          {/* 游戏记录提示 */}
          {showRecordTip && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              user 
                ? 'bg-green-50 text-green-600 border border-green-200' 
                : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
            }`}>
              {user 
                ? '✅ 您的游戏记录已保存' 
                : '💡 登录后可保存您的游戏记录'}
            </div>
          )}

          {/* 按钮组 */}
          <div className="space-y-3">
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full gap-2"
            >
              <Share2 className="w-4 h-4" />
              分享给朋友
            </Button>
            <Button
              onClick={resetGame}
              className={`w-full gap-2 ${
                won
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              再玩一次
            </Button>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-sm text-gray-400 mt-6">
          {won
            ? '恭喜你！保持真诚，才能维系美好的感情 💕'
            : '别灰心，真诚最重要，下次一定行！'}
        </p>
      </div>
    </div>
  );
}
