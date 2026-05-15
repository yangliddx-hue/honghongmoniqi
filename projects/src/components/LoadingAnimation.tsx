'use client';

import React from 'react';
import { Heart } from 'lucide-react';

interface LoadingAnimationProps {
  gender: 'female' | 'male' | null;
}

export function LoadingAnimation({ gender }: LoadingAnimationProps) {
  const pronoun = gender === 'female' ? '她' : gender === 'male' ? '他' : 'TA';

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <Heart className="w-12 h-12 text-pink-400 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-pink-300 rounded-full animate-bounce opacity-75" />
        </div>
      </div>
      <p className="mt-4 text-gray-500 animate-pulse">
        {pronoun}正在思考...
      </p>
    </div>
  );
}
