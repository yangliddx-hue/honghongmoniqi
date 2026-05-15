'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';
import { AffectionBar } from '@/components/AffectionBar';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { VOICE_CONFIG, MAX_ROUNDS, Message, Option } from '@/types/game';

export function GameScreen() {
  const {
    gameState,
    selectOption,
    setMessages,
    setCurrentOptions,
    setGameOver,
    setIsLoading,
  } = useGame();

  const { gender, scenario, voiceType, messages, currentOptions, affection, step, isLoading } = gameState;

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioMessageId, setCurrentAudioMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef(false);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 生成对话
  const generateNextRound = useCallback(async () => {
    if (!gender || !scenario || !voiceType) {
      console.error('Missing game config');
      return;
    }

    // 防止重复生成
    if (isGeneratingRef.current) {
      return;
    }

    // 如果是游戏结束或步骤为0，不生成
    if (step === 0 || gameState.gameOver) {
      return;
    }

    isGeneratingRef.current = true;
    setError(null);

    try {
      // 检查是否游戏结束
      const won = affection >= 80;
      const lost = affection < -50 || (step > MAX_ROUNDS && affection < 80);
      const isGameOver = won || lost || (step > MAX_ROUNDS && affection >= 80);

      if (isGameOver) {
        setGameOver(true, won);
        setIsLoading(false);
        isGeneratingRef.current = false;
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          scenario: scenario.title,
          messages,
          affection,
          step,
          isGameOver,
          won,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();

      // 添加对方的消息
      const newMessages: Message[] = [
        ...messages,
        { role: 'partner' as const, content: data.partnerMessage },
      ];

      setMessages(newMessages);
      setCurrentOptions(data.options || []);
      setIsLoading(false);

      // 生成唯一消息ID用于语音
      const messageId = `${data.partnerMessage}-${newMessages.length}-${Date.now()}`;
      setCurrentAudioMessageId(messageId);
      setAudioUri(null); // 重置音频URI以触发新语音生成
    } catch (err) {
      console.error('Failed to generate response:', err);
      setError('生成对话失败，请重试');
      setIsLoading(false);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [gender, scenario, voiceType, messages, affection, step, gameState.gameOver, setMessages, setCurrentOptions, setGameOver, setIsLoading]);

  // 初始化游戏 & 继续生成
  useEffect(() => {
    // 当 step > 0 且游戏未结束时，需要生成对话
    // messages.length 为偶数时（0, 2, 4...），表示刚结束一轮选择，需要生成对方回复
    // messages.length 为奇数时（1, 3, 5...），表示刚收到对方消息，等待用户选择
    if (step > 0 && !gameState.gameOver && messages.length % 2 === 0) {
      generateNextRound();
    }
  }, [step, gameState.gameOver, messages.length, generateNextRound]);

  // 生成语音
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'partner' || !voiceType) {
      return;
    }

    const messageId = `${lastMessage.content}-${messages.length}`;
    if (messageId === currentAudioMessageId && audioUri) {
      return; // 已有该消息的语音
    }

    const generateAudio = async () => {
      try {
        const speaker = VOICE_CONFIG[voiceType]?.speaker;
        if (!speaker) return;

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: lastMessage.content,
            speaker,
            uid: `game-${Date.now()}`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAudioUri(data.audioUri);
          setCurrentAudioMessageId(messageId);
        }
      } catch (err) {
        console.error('Failed to generate audio:', err);
      }
    };

    generateAudio();
  }, [messages, voiceType, currentAudioMessageId, audioUri]);

  // 播放语音
  const playAudio = useCallback(() => {
    if (!audioUri) return;

    const audio = new Audio(audioUri);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play();
  }, [audioUri]);

  // 处理选项选择
  const handleSelectOption = useCallback((option: Option) => {
    setAudioUri(null);
    setCurrentAudioMessageId(null);
    selectOption(option);
  }, [selectOption]);

  // 重试
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    generateNextRound();
  }, [generateNextRound, setIsLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex flex-col">
      {/* 顶部状态栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* 轮次显示 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              第 <span className="font-bold text-purple-600">{Math.min(step, MAX_ROUNDS)}</span> 轮 / 共 {MAX_ROUNDS} 轮
            </span>
            {scenario && (
              <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs">
                {scenario.title}
              </span>
            )}
          </div>
          {/* 好感度条 */}
          <AffectionBar affection={affection} />
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 消息列表 */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === 'partner' && index === messages.length - 1 && (
                  <button
                    onClick={playAudio}
                    disabled={!audioUri}
                    className="mt-2 flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600 disabled:opacity-50"
                  >
                    {isPlaying ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span>{isPlaying ? '停止' : '播放'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* 加载动画 */}
          {isLoading && <LoadingAnimation gender={gender} />}

          {/* 错误提示 */}
          {error && (
            <div className="flex justify-center">
              <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                重试
              </Button>
            </div>
          )}

          {/* 消息底部锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 选项区域 */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 gap-2">
            {currentOptions.map((option) => (
              <Button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                variant="outline"
                className="h-auto py-3 px-4 text-left whitespace-normal bg-white hover:bg-pink-50 hover:border-pink-300 transition-colors"
                disabled={isLoading}
              >
                {option.content}
              </Button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            选择一个回复，看看对方会怎么反应
          </p>
        </div>
      </div>
    </div>
  );
}
