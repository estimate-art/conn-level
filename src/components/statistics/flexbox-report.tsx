
'use client';

import React from 'react';
import type { OutletDataMap } from '@/lib/types';
import { formatOutletName } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PerformanceCard from './performance-card';

type FlexboxReportProps = {
    outlets: string[];
    outletDataMap: OutletDataMap;
};

export default function FlexboxReport({ outlets, outletDataMap }: FlexboxReportProps) {
    const categoryOrder = ['Активації PrP+PoP', 'Контракти B2C', 'MNP', 'Гаджети', 'ДУ', 'Контракти B2B', 'VEGA'];
    
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">FLEXBOX Звіт</h2>
        <p className="text-muted-foreground">Компактний звіт по всім точкам</p>
      </div>
      <div className="space-y-4">
        {outlets.map(outletName => {
          const outletPerformanceData = outletDataMap.get(outletName);
          if (!outletPerformanceData) return null;
          
          const factDataMap = new Map(outletPerformanceData.factData.map(item => [item.category, item]));

          return (
            <Card key={outletName} className="conn-hub-style !bg-gradient-to-br from-black/20 to-black/30 !p-0">
              <CardHeader className="py-2 px-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {formatOutletName(outletName)}
                </CardTitle>
                 {outletPerformanceData.details && <p className="text-sm text-muted-foreground">{outletPerformanceData.details}</p>}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {outletPerformanceData.factData.length > 0 ? (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categoryOrder.map((categoryName) => {
                       const item = factDataMap.get(categoryName);
                       if (!item) return <div key={categoryName} className="conn-hub-style !p-2 !rounded-xl opacity-20 h-[108px]" />;

                       return (
                         <div key={`${outletName}-${categoryName}`} className="h-[108px]">
                           <PerformanceCard item={item} variant="flexbox" />
                         </div>
                       );
                    })}
                  </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">Немає даних про продуктивність.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
