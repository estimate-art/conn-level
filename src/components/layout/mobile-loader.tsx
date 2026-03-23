
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export default function MobileLoader() {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-[--glass-blue-top] to-[--glass-blue-bottom] opacity-30 animate-pulse blur-2xl"></div>
        <div className={cn(
            'conn-hub-style !rounded-full h-24 w-24 flex items-center justify-center animate-pulse'
        )}>
           <svg className="w-10 h-10 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
        </div>
      </div>
    </div>
  );
}
