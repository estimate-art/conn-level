
'use client';

import React from 'react';
import type { FactCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getShortCategoryName, getLevelClasses } from '@/lib/statistics-utils';

type PerformanceCardProps = {
    item: FactCategory;
    variant?: 'default' | 'flexbox';
};

const PerformanceCard = React.forwardRef<HTMLDivElement, PerformanceCardProps>(({ item, variant = 'default' }, ref) => {
    if (item.category === 'NBO') return null; // NBO has a custom layout and is handled separately

    const fact = Math.round(item.fact || 0);
    const levels = item.levels
        .map(l => parseFloat(l.value as string) || 0)
        .filter(v => v > 0)
        .sort((a, b) => a - b);
    
    const levelPositions = [30, 65, 95];
    
    let progressWidth = 0;

    if (levels.length > 0) {
        const currentLevelIndex = levels.reduce((acc, level, index) => (fact >= level ? index : acc), -1);

        if (currentLevelIndex === -1) { 
            const progress = (fact / levels[0]) * levelPositions[0];
            progressWidth = Math.max(0, Math.min(progress, levelPositions[0]));
        } else if (currentLevelIndex < levels.length - 1) {
            const currentLevelValue = levels[currentLevelIndex];
            const nextLevelValue = levels[currentLevelIndex + 1];
            const currentLevelPosition = levelPositions[currentLevelIndex];
            const nextLevelPosition = levelPositions[currentLevelIndex + 1];
            
            const segmentProgress = (fact - currentLevelValue) / (nextLevelValue - currentLevelValue);
            const calculatedWidth = currentLevelPosition + (nextLevelPosition - currentLevelPosition) * segmentProgress;
            progressWidth = Math.max(0, Math.min(calculatedWidth, nextLevelPosition));
        } else {
            progressWidth = 100;
        }
    }

    progressWidth = isNaN(progressWidth) ? 0 : Math.max(0, Math.min(progressWidth, 100));
    
    const displayName = getShortCategoryName(item.category);
    const colorClass = getLevelClasses(item);

    return (
        <div ref={ref} tabIndex={0} className={cn(
            'conn-hub-style focus:outline-none p-4 rounded-3xl transition-all duration-300 flex flex-col justify-between h-full relative', 
            'pb-[44px]', // Padding for level labels
            colorClass,
            variant === 'flexbox' && 'h-[108px]'
        )}>
             <div className="flex justify-between items-start mb-1">
                <span className={cn("font-bold uppercase tracking-[1.5px] text-white/95 leading-tight max-w-[160px] text-xs")}>{displayName}</span>
                <div className="text-right">
                    <span className={cn("font-semibold tracking-[-1.5px] leading-[0.9] text-2xl")}>{fact}</span>
                </div>
            </div>
            <div className={cn("relative mt-2 h-[2px]")}>
                <div className={cn("bg-white/20 rounded-full w-full h-full")}>
                    <div className="h-full bg-white rounded-full shadow-[0_0_25px_rgba(255,255,255,0.75)] z-[2] relative" style={{ width: `${progressWidth}%` }}/>
                </div>
                {levels.map((levelValue, index) => {
                    if (index >= levelPositions.length) return null;
                    const isAchieved = fact >= levelValue;
                    return (
                        <div 
                            key={index}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-white z-[3] transition-all duration-300 w-4 h-4 border-2",
                                isAchieved 
                                    ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
                                    : "bg-black/40"
                            )}
                            style={{ left: `${levelPositions[index]}%` }}
                        >
                             <span className={cn(
                                "absolute left-1/2 -translate-x-1/2 font-black text-white/60 whitespace-nowrap top-[18px] text-[9px]",
                                "shadow-[0_2px_8px_rgba(0,0,0,0.5)]",
                                isAchieved && "text-white"
                             )}>
                                L{index + 1}: {levelValue}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
PerformanceCard.displayName = 'PerformanceCard';

export default PerformanceCard;
