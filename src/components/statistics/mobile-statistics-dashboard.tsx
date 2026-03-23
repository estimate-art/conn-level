
'use client';

import React, { useMemo } from 'react';
import { UploadCloud, Trash2, ShoppingBag, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

import type { OutletData, OutletGroup, ProcessedPrpData, ProcessedPopData, OutletDataMap, StatisticsView, OrderData, AppView } from '@/lib/types';

import PrpReport from './prp-report';
import PopReport from './pop-report';
import FlexboxReport from './flexbox-report';
import VfView from './vf-view';
import { PacingDialog } from './pacing-dialog';
import OrderView from '../orders/order-view';
import { cn } from '@/lib/utils';
import { SubButton } from '../layout/statistics-dashboard';


type MobileStatisticsDashboardProps = {
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
    selectedOutlet: string;
    setSelectedOutlet: (outlet: string) => void;
    outletDataMap: OutletDataMap;
};

export default function MobileStatisticsDashboard({
    onFileUpload,
    data,
    outlets,
    outletGroups,
    prpData,
    popData,
    orderData,
    setOrderData,
    orderFileName,
    setOrderFileName,
    loading,
    error,
    currentView,
    setCurrentView,
    importDate,
    clearCache,
    showExperimental,
    selectedOutlet,
    setSelectedOutlet,
    outletDataMap,
}: MobileStatisticsDashboardProps) {
    const currentOutletData = useMemo(() => {
        const outletRows = data.filter(d => d['Аутлет'] === selectedOutlet);
        if (outletRows.length === 0) return undefined;
        return outletRows.reduce((acc, curr) => ({...acc, ...curr}), {});
      }, [data, selectedOutlet]);
      
    const handleViewChange = (view: StatisticsView) => {
        setCurrentView(view);
    }

    const renderContent = () => {
        switch (currentView) {
            case 'orders':
                return (
                    <OrderView
                        onBack={() => handleViewChange('menu')}
                        orderData={orderData}
                        setOrderData={setOrderData}
                        fileName={orderFileName}
                        setFileName={setOrderFileName}
                    />
                );
            case 'vf-style':
                 return <VfView 
                    outlets={outlets}
                    outletDataMap={outletDataMap}
                    outletGroups={outletGroups}
                    selectedOutlet={selectedOutlet}
                    setSelectedOutlet={setSelectedOutlet}
                    prpData={prpData}
                    popData={popData}
                    setShowPrpReport={() => handleViewChange('prp-report')}
                    setShowPopReport={() => handleViewChange('pop-report')}
                    onBack={() => handleViewChange('menu')} 
                    isMobile={true} 
                    onToggleView={() => {}}
                />;
            case 'prp-report':
                return <PrpReport prpData={prpData!} outletGroups={outletGroups} />;
            case 'pop-report':
                return <PopReport popData={popData!} />;
            case 'flexbox-report':
                return <FlexboxReport outlets={outlets} outletDataMap={outletDataMap} />;
            case 'pacing-dialog':
                if (currentOutletData) {
                    return (
                        <div>
                            <PacingDialog outletName={selectedOutlet} outletData={currentOutletData} open={true} onOpenChange={() => handleViewChange('menu')} />
                        </div>
                    );
                }
                return null;
            case 'menu':
            default:
                if (loading) return <div className="text-center p-10 h-[calc(100vh-280px)]">Завантаження даних...</div>;
                if (error) return <div className="text-center p-10 text-destructive h-[calc(100vh-280px)]">{error}</div>;

                const formattedDate = importDate ? format(new Date(importDate), 'dd.MM') : null;

                return (
                    <div className="flex flex-col items-center justify-center pt-8 h-[calc(100vh-280px)]">
                        <h2 className="text-2xl font-bold mb-8">Статистика</h2>
                        <div className="w-full max-w-md flex flex-col gap-4">
                            <label htmlFor="file-upload" className={cn('conn-hub-style w-full !p-4 !rounded-3xl transition-all duration-300 flex justify-between items-center text-left cursor-pointer')}>
                                <span className="font-bold text-lg">
                                    Імпорт статистики
                                    {formattedDate && <span className="text-sm font-normal ml-2 text-muted-foreground">({formattedDate})</span>}
                                </span>
                                <UploadCloud className="w-6 h-6" />
                            </label>
                            <input id="file-upload" type="file" accept=".xlsx, .xls" onChange={onFileUpload} className="hidden" multiple />

                            <div className={cn("conn-hub-style !p-4 !rounded-3xl test-dev")}>
                                <button onClick={() => handleViewChange('orders')} className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag className="w-5 h-5" />
                                        <h4 className="font-bold text-lg">Замовлення</h4>
                                    </div>
                                </button>
                            </div>

                            {data.length > 0 && (
                                <>
                                    <button
                                        onClick={() => handleViewChange('flexbox-report')}
                                        className={cn('conn-hub-style w-full !p-4 !rounded-3xl transition-all duration-300 flex justify-between items-center text-left')}
                                    >
                                        <span className="font-bold text-lg">Flexbox</span>
                                        <TrendingUp className="w-6 h-6" />
                                    </button>

                                    <div className={cn('glass-card !p-4 !rounded-3xl')}>
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => handleViewChange('vf-style')} className="flex items-center gap-2 flex-1">
                                                <h4 className="font-bold text-lg">Vodafone</h4>
                                            </button>
                                            <div className="flex gap-2">
                                                {currentOutletData && <SubButton className="sms-btn active w-[80px]" onClick={(e) => { e.stopPropagation(); handleViewChange('pacing-dialog') }} text="Темпи" />}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={clearCache} className="w-full mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Очистити збережені дані
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={cn(currentView !== 'orders' && 'relative pt-8')}>
            {renderContent()}
        </div>
    );
}
