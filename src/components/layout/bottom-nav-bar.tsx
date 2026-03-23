'use client';

import { cn } from '@/lib/utils';
import type { AppView } from '@/lib/types';
import { Home, Store, ShoppingCart, Send, Filter } from 'lucide-react';

type BottomNavBarProps = {
  currentView: AppView;
  setView: (view: AppView) => void;
  onFilterClick: () => void;
};

export default function BottomNavBar({ currentView, setView, onFilterClick }: BottomNavBarProps) {
  const navItems = [
    { view: 'main-menu', label: 'Головна', icon: Home },
    { view: 'statistics', label: 'Ритейл', icon: Store },
    { view: 'sales', label: 'Маркет', icon: ShoppingCart },
  ] as const;

  const isSalesView = currentView === 'sales';

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-md flex items-center gap-2 z-50">
      <nav className="relative flex-1 flex justify-around items-center h-[68px] rounded-[34px] border border-white/10 bg-black/80 backdrop-blur-sm shadow-2xl p-2.5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={cn(
              'flex flex-col items-center text-white/40 no-underline gap-1 transition-all duration-300 w-[60px]',
              currentView === item.view && 'text-white'
            )}
          >
            <item.icon
              className={cn(
                'w-[26px] h-[26px] transition-transform duration-300',
                 currentView === item.view && '-translate-y-0.5'
              )}
              strokeWidth={currentView === item.view ? 2.2 : 2}
            />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="flex items-center">
            {isSalesView ? (
                 <button 
                    onClick={onFilterClick}
                    className={cn(
                        'glass-card achieved !p-0 h-[68px] min-w-[90px] flex flex-col justify-center items-center gap-1 text-white active:scale-95 transition-all duration-300'
                    )}
                 >
                    <Filter className="w-[22px] h-[22px]" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Фільтр</span>
                </button>
            ) : (
                <button 
                    onClick={() => setView('sms-form')}
                    className={cn(
                        'glass-card achieved !p-0 h-[68px] min-w-[90px] flex flex-col justify-center items-center gap-1 text-white active:scale-95 transition-all duration-300'
                    )}
                >
                    <Send className="w-[22px] h-[22px] fill-white" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Надіслати</span>
                </button>
            )}
      </div>
    </div>
  );
}
