'use client';

import { GameProvider, useGame } from '@/context/GameContext';
import { StartScreen } from '@/components/StartScreen';
import { GameScreen } from '@/components/GameScreen';
import { GameOverScreen } from '@/components/GameOverScreen';

function GameContent() {
  const { gameState } = useGame();
  const { step, gameOver } = gameState;

  // 根据游戏状态显示不同界面
  if (gameOver) {
    return <GameOverScreen />;
  }

  if (step > 0) {
    return <GameScreen />;
  }

  return <StartScreen />;
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
