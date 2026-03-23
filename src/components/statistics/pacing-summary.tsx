
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { OutletData } from '@/lib/types';

type PacingSummaryProps = {
    outletRawData: OutletData | undefined;
    relatedCols: any;
};

export default function PacingSummary({ outletRawData, relatedCols }: PacingSummaryProps) {
    
    const PacingBlock = ({ categoryName, displayName, targetLevel }: { categoryName: string, displayName: string, targetLevel: number }) => {
        if (!outletRawData || !relatedCols || !relatedCols[categoryName]) return null;

        const catData = relatedCols[categoryName];
        if (!catData.levels || catData.levels.length < targetLevel) return null;

        let factValue = 0;
        if (categoryName === 'MNP' && catData.extraFacts) {
            const prp = parseFloat(outletRawData[catData.extraFacts?.[0]?.col] as string) || 0;
            const pop = parseFloat(outletRawData[catData.extraFacts?.[1]?.col] as string) || 0;
            factValue = prp + pop;
        } else if (catData.fact) {
            factValue = parseFloat(outletRawData[catData.fact] as string) || 0;
        }
        
        const targetValue = parseFloat(outletRawData[catData.levels[targetLevel - 1]] as string);

        if (isNaN(targetValue) || targetValue <= 0) return null;

        const remaining = Math.max(0, targetValue - factValue);
        
        return (
            <Card className="conn-hub-style text-center p-1 flex flex-col justify-center flex-grow w-40 max-w-40 h-auto max-h-[120px]">
                <CardHeader className="p-2">
                    <CardTitle className="text-sm">{displayName}</CardTitle>
                    <CardDescription className="text-xs">до LvL {targetLevel}</CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                    <p className="text-2xl font-bold">{remaining.toFixed(0)}</p>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="flex justify-center items-stretch gap-4 py-2">
            <PacingBlock categoryName="Активації PrP+PoP" displayName="Активації" targetLevel={3} />
            <PacingBlock categoryName="Контракти B2C" displayName="B2C" targetLevel={3} />
            <PacingBlock categoryName="MNP" displayName="MNP" targetLevel={3} />
            <PacingBlock categoryName="Гаджети" displayName="Гаджети" targetLevel={1} />
            <PacingBlock categoryName="ДУ" displayName="ДУ" targetLevel={1} />
        </div>
    );
};
