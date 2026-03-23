'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, BarChart, ShoppingCart } from 'lucide-react';

type AppView = 'main-menu' | 'statistics' | 'sms-form' | 'sales';

type MainMenuProps = {
  setView: (view: AppView) => void;
};

export default function MainMenu({ setView }: MainMenuProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 h-full min-h-[calc(100vh-112px)] md:min-h-0 md:h-[calc(100vh-80px)]">
      <h2 className="text-2xl font-bold mb-10">Головне меню</h2>
      
      <div className="w-full max-w-xs flex flex-col gap-4">
        <button 
            onClick={() => setView('sms-form')}
            className={cn(
                'glass-card w-full !p-6 !rounded-3xl transition-all duration-300 achieved',
                'flex justify-between items-center text-left'
            )}
        >
            <span className="font-bold text-lg">Надіслати запит</span>
            <ArrowRight className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-2 gap-4">
            <button
                onClick={() => setView('statistics')}
                className="conn-hub-style h-24 !p-4 !rounded-3xl flex flex-col items-center justify-center text-center"
            >
                <BarChart className="w-8 h-8 mb-2" />
                <span className="text-sm font-bold">Статистика</span>
            </button>
            <button
                onClick={() => setView('sales')}
                className="conn-hub-style h-24 !p-4 !rounded-3xl flex flex-col items-center justify-center text-center"
            >
                <ShoppingCart className="w-8 h-8 mb-2" />
                <span className="text-sm font-bold">Маркет</span>
            </button>
        </div>
      </div>
    </div>
  );
}
