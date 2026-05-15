'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  GameState,
  Gender,
  Scenario,
  VoiceType,
  Option,
  Message,
  INITIAL_GAME_STATE,
  INITIAL_AFFECTION,
  MAX_AFFECTION,
  MIN_AFFECTION,
  WIN_AFFECTION,
  MAX_ROUNDS,
} from '@/types/game';

interface GameContextType {
  gameState: GameState;
  setGender: (gender: Gender) => void;
  setScenario: (scenario: Scenario) => void;
  setVoiceType: (voiceType: VoiceType | null) => void;
  startGame: () => void;
  selectOption: (option: Option) => void;
  resetGame: () => void;
  setMessages: (messages: Message[]) => void;
  setCurrentOptions: (options: Option[]) => void;
  setAffection: (affection: number) => void;
  setGameOver: (gameOver: boolean, won: boolean) => void;
  setStep: (step: number) => void;
  setIsLoading: (isLoading: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  const setGender = useCallback((gender: Gender) => {
    setGameState((prev) => ({ ...prev, gender }));
  }, []);

  const setScenario = useCallback((scenario: Scenario) => {
    setGameState((prev) => ({ ...prev, scenario }));
  }, []);

  const setVoiceType = useCallback((voiceType: VoiceType | null) => {
    setGameState((prev) => ({ ...prev, voiceType }));
  }, []);

  const startGame = useCallback(() => {
    setGameState((prev) => {
      const gender = prev.gender;
      const scenario = prev.scenario;
      const voiceType = prev.voiceType;

      if (!gender || !scenario || !voiceType) {
        console.error('Missing game config: gender or scenario or voiceType');
        return prev;
      }

      return {
        ...prev,
        step: 1,
        affection: INITIAL_AFFECTION,
        messages: [],
        currentOptions: [],
        gameOver: false,
        won: false,
        isLoading: true,
      };
    });
  }, []);

  const selectOption = useCallback((option: Option) => {
    setGameState((prev) => {
      // 计算新的好感度
      const newAffection = Math.min(
        MAX_AFFECTION,
        Math.max(MIN_AFFECTION, prev.affection + option.score)
      );

      // 添加用户消息
      const newMessages: Message[] = [
        ...prev.messages,
        { role: 'user', content: option.content },
      ];

      // 检查游戏是否结束
      const won = newAffection >= WIN_AFFECTION;
      const lost = newAffection < MIN_AFFECTION || (prev.step >= MAX_ROUNDS && newAffection < WIN_AFFECTION);
      const gameOver = won || lost;

      return {
        ...prev,
        affection: newAffection,
        messages: newMessages,
        step: gameOver ? prev.step : prev.step + 1,
        gameOver,
        won,
        isLoading: !gameOver,
        currentOptions: [],
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
  }, []);

  const setMessages = useCallback((messages: Message[]) => {
    setGameState((prev) => ({ ...prev, messages }));
  }, []);

  const setCurrentOptions = useCallback((currentOptions: Option[]) => {
    setGameState((prev) => ({ ...prev, currentOptions }));
  }, []);

  const setAffection = useCallback((affection: number) => {
    setGameState((prev) => ({ ...prev, affection }));
  }, []);

  const setGameOver = useCallback((gameOver: boolean, won: boolean) => {
    setGameState((prev) => ({ ...prev, gameOver, won }));
  }, []);

  const setStep = useCallback((step: number) => {
    setGameState((prev) => ({ ...prev, step }));
  }, []);

  const setIsLoading = useCallback((isLoading: boolean) => {
    setGameState((prev) => ({ ...prev, isLoading }));
  }, []);

  const value: GameContextType = {
    gameState,
    setGender,
    setScenario,
    setVoiceType,
    startGame,
    selectOption,
    resetGame,
    setMessages,
    setCurrentOptions,
    setAffection,
    setGameOver,
    setStep,
    setIsLoading,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
