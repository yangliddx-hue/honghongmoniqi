'use client';

import React from 'react';
import { MAX_AFFECTION, MIN_AFFECTION } from '@/types/game';

interface AffectionBarProps {
  affection: number;
}

export function AffectionBar({ affection }: AffectionBarProps) {
  // 计算进度条百分比（将-50到100映射到0到100）
  const percentage = ((affection - MIN_AFFECTION) / (MAX_AFFECTION - MIN_AFFECTION)) * 100;

  // 根据好感度获取颜色
  const getColor = () => {
    if (affection < 0) return '#ef4444'; // 红色
    if (affection < 50) return '#eab308'; // 黄色
    if (affection < 80) return '#3b82f6'; // 蓝色
    return '#22c55e'; // 绿色
  };

  // 获取文字提示
  const getLabel = () => {
    if (affection < -30) return '非常生气';
    if (affection < 0) return '有点生气';
    if (affection < 30) return '还在生气';
    if (affection < 60) return '渐渐消气';
    if (affection < 80) return '快哄好了';
    return '原谅你了';
  };

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">好感度</span>
        <span className="text-sm font-medium text-gray-500">{getLabel()}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">💔</span>
        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: getColor(),
            }}
          />
        </div>
        <span className="text-xs text-gray-400">💕</span>
      </div>
    </div>
  );
}
