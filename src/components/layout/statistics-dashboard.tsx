
"use client";

import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import type { OutletData, OutletGroup, ProcessedPrpData, ProcessedPopData, FactCategory, OutletDataMap, ViewMode, StatisticsView, OrderData, AppView } from '@/lib/types';
import { findRelatedColumns, getOutletDetails } from '@/lib/excel-processor';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileStatisticsDashboard from '../statistics/mobile-statistics-dashboard';
import DesktopStatisticsDashboard from '../statistics/desktop-statistics-dashboard';
import { cn } from '@/lib/utils';

type StatisticsDashboardProps = {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  data: OutletData[];
  outlets: string[];
  outletGroups: OutletGroup[];
  prpData: ProcessedPrpData | null;
  popData: ProcessedPopData | null;
  orderData: OrderData[];
  setOrderData: (data: OrderData[]) => void;
  orderFileName: string | null;
  setOrderFileName: (name: string | null) => void;
  loading: boolean;
  error: string | null;
  currentView: StatisticsView;
  setCurrentView: (view: StatisticsView) => void;
  setAppView: (view: AppView) => void;
  importDate: string | null;
  clearCache: () => void;
  showExperimental: boolean;
};

export const SubButton = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { text: string }
>(({ text, className, ...props }, ref) => {
    return (
        <button 
            ref={ref} 
            className={cn(
                "inline-flex items-center justify-center", // Centering
                "!p-2 !rounded-xl text-xs h-9", // Sizing and text
                className
            )} 
            {...props}
        >
            <span className="sub-button-text">{text}</span>
        </button>
    )
});
SubButton.displayName = "SubButton";


export default function StatisticsDashboard(props: StatisticsDashboardProps) {
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (props.outlets.length > 0 && !selectedOutlet) {
        setSelectedOutlet(props.outlets[0]);
    }
  }, [props.outlets, selectedOutlet]);
  
  const outletDataMap: OutletDataMap = useMemo(() => {
    const map: OutletDataMap = new Map();
    if (props.data.length === 0 || props.outlets.length === 0) return map;

    const dataByOutlet = props.data.reduce((acc, row) => {
        const outletName = row['Аутлет'] as string;
        if (!outletName) return acc;

        if (!acc[outletName]) {
            acc[outletName] = {};
        }
        // Merge rows for the same outlet
        acc[outletName] = { ...acc[outletName], ...row };
        return acc;
    }, {} as { [key: string]: OutletData });

    props.outlets.forEach(outlet => {
        const outletRawData = dataByOutlet[outlet];
        if (outletRawData) {
            const headers = Object.keys(outletRawData);
            const relatedCols = findRelatedColumns(headers);

            const categoryOrder = ['Активації PrP+PoP', 'Контракти B2C', 'MNP', 'Гаджети', 'ДУ', 'Контракти B2B', 'NBO', 'VEGA'];

            const reportData = categoryOrder.map(category => {
                if (!relatedCols[category]) return null;

                const factColumnsForCategory = relatedCols[category];
                if (category === 'NBO') {
                    return {
                        category: 'NBO',
                        fields: factColumnsForCategory.fields.map((field: any) => ({
                            name: field.name,
                            value: outletRawData[field.col],
                        })),
                        levels: [],
                    };
                }
                let factValue: number;
                if (category === 'MNP' && factColumnsForCategory.extraFacts) {
                    const prp = parseFloat(outletRawData[factColumnsForCategory.extraFacts[0].col] as string) || 0;
                    const pop = parseFloat(outletRawData[factColumnsForCategory.extraFacts[1].col] as string) || 0;
                    factValue = prp + pop;
                } else {
                    factValue = parseFloat(outletRawData[factColumnsForCategory.fact!] as string);
                }
                const levelColNames = factColumnsForCategory.levels;
                return {
                    category,
                    fact: factValue,
                    levels: levelColNames.map((levelName: string) => ({
                        name: levelName, value: outletRawData[levelName],
                    })),
                };
            }).filter(Boolean) as FactCategory[];

            map.set(outlet, {
                factData: reportData,
                details: getOutletDetails(outlet, props.data),
                rawData: outletRawData
            });
        }
    });

    return map;
}, [props.outlets, props.data]);

  if (isMobile === undefined) {
    return <div className="text-center p-10 h-[calc(100vh-280px)]">Завантаження...</div>;
  }
  
  if (isMobile) {
    return <MobileStatisticsDashboard 
        {...props}
        selectedOutlet={selectedOutlet}
        setSelectedOutlet={setSelectedOutlet}
        outletDataMap={outletDataMap}
    />
  }
  
    return <DesktopStatisticsDashboard
        {...props}
        selectedOutlet={selectedOutlet}
        setSelectedOutlet={setSelectedOutlet}
        outletDataMap={outletDataMap}
    />;
}
