
'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OutletData } from '@/lib/types';
import { findRelatedColumns } from '@/lib/excel-processor';
import { formatOutletName } from '@/lib/utils';

type PacingDialogProps = {
  outletName: string;
  outletData: OutletData;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type PacingInfo = {
  category: string;
  fact: number;
  target: number;
  pace: string;
};

const PacingItem = ({ item }: { item: PacingInfo }) => (
  <div className="flex justify-between items-center py-2">
    <span className="font-semibold">{item.category}</span>
    <div className="flex items-center gap-4">
      <span className="font-mono text-sm">
        {item.fact} / {item.target}
      </span>
      <Badge variant="secondary" className="w-24 justify-center">{`Треба: ${item.pace}`}</Badge>
    </div>
  </div>
);

export function PacingDialog({ outletName, outletData, open, onOpenChange }: PacingDialogProps) {
  const pacingData = useMemo(() => {
    if (!outletData) return { group1: [], group2: [], group3: [] };

    const headers = Object.keys(outletData);
    const relatedCols = findRelatedColumns(headers);

    const now = new Date();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = totalDays - now.getDate() + 1;

    const calculatePace = (fact: number, target: number) => {
        if (remainingDays <= 0 || target <= 0) return '0 / день';
        const remainingTarget = Math.max(0, target - fact);
        const pace = remainingTarget / remainingDays;
        return `${pace.toFixed(1)} / день`;
    }

    const getPacingForCategory = (category: string, targetLevel: number, displayName?: string): PacingInfo | null => {
        const catData = relatedCols[category];
        if (!catData || !catData.levels || catData.levels.length < targetLevel) return null;

        let factValue: number;
        if (category === 'MNP') {
            const prp = parseFloat(outletData[catData.extraFacts![0].col] as string) || 0;
            const pop = parseFloat(outletData[catData.extraFacts![1].col] as string) || 0;
            factValue = prp + pop;
        } else {
            factValue = parseFloat(outletData[catData.fact!] as string) || 0;
        }
        
        const targetValue = parseFloat(outletData[catData.levels[targetLevel - 1]] as string);

        if (isNaN(targetValue) || targetValue <= 0) return null;

        return {
            category: displayName || category,
            fact: factValue,
            target: targetValue,
            pace: calculatePace(factValue, targetValue)
        };
    };

    const group1Categories: {name: string, displayName: string}[] = [
        { name: 'Активації PrP+PoP', displayName: 'Активації'}, 
        { name: 'Контракти B2C', displayName: 'Контракти' }, 
        { name: 'MNP', displayName: 'MNP' }
    ];
    const group2Categories = ['Гаджети', 'ДУ'];
    const group3Categories: {name: string, displayName: string}[] = [
        { name: 'Контракти B2B', displayName: 'B2B'},
        { name: 'VEGA', displayName: 'VEGA' }
    ];

    const group1 = group1Categories.map(cat => getPacingForCategory(cat.name, 3, cat.displayName)).filter(Boolean) as PacingInfo[];
    const group2 = group2Categories.map(cat => getPacingForCategory(cat, 1)).filter(Boolean) as PacingInfo[];
    const group3 = group3Categories.map(cat => {
         const catData = relatedCols[cat.name];
         if (!catData) return null;
         const factValue = parseFloat(outletData[catData.fact!] as string) || 0;
         const targetValue = parseFloat(outletData[catData.levels[0]] as string) || 1;
         return {
            category: cat.displayName,
            fact: factValue,
            target: targetValue,
            pace: 'Продаж'
         }
    }).filter(Boolean) as PacingInfo[];


    return { group1, group2, group3 };
  }, [outletData]);

  const hasPacingData = pacingData.group1.length > 0 || pacingData.group2.length > 0 || pacingData.group3.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Темпи</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Аналіз темпів</DialogTitle>
          <DialogDescription>
            Необхідний щоденний темп для досягнення цільових показників для {formatOutletName(outletName)}.
          </DialogDescription>
        </DialogHeader>
        {hasPacingData ? (
        <div className="space-y-4 pt-4">
          {pacingData.group1.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Ключовий пріоритет (Рівень 3)</h4>
              <div className="divide-y divide-border rounded-md border">
                {pacingData.group1.map(item => <PacingItem key={item.category} item={item} />)}
              </div>
            </div>
          )}
          {pacingData.group2.length > 0 && (
             <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Основний план (Рівень 1)</h4>
              <div className="divide-y divide-border rounded-md border">
                {pacingData.group2.map(item => <PacingItem key={item.category} item={item} />)}
              </div>
            </div>
          )}
          {pacingData.group3.length > 0 && (
             <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Додаткові показники</h4>
              <div className="divide-y divide-border rounded-md border">
                {pacingData.group3.map(item => <PacingItem key={item.category} item={item} />)}
              </div>
            </div>
          )}
        </div>
         ) : (
            <div className="text-center p-8 text-muted-foreground">
                <p>Дані для розрахунку темпів відсутні.</p>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
