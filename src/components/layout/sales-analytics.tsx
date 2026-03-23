'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { AppView, SalesConfig, ViewableSale } from '@/lib/types';
import SalesSidebar from '@/components/sales/SalesSidebar';
import SalesView from '@/components/sales/SalesView';
import SalesRemainsView from '@/components/sales/SalesRemainsView';
import SalesReportsView from '@/components/sales/SalesReportsView';
import SalesSettingsView from '@/components/sales/SalesSettingsView';
import { useIsMobile } from '@/hooks/use-mobile';
import LegacySalesAnalytics from '@/components/sales/legacy-sales-analytics';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import MappingDialog from '@/components/sales/MappingDialog';
import { getSales } from '@/app/actions/remonline-sales';
import { updateSalesConfig } from '@/app/actions/remonline-config';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { BellRing, ArrowLeft, BarChart3, Package, FileText, Settings } from 'lucide-react';
import { WarningsDialog } from '../sales/WarningsDialog';
import { Card } from '../ui/card';


export type MarketSubView = 'menu' | 'sales' | 'remains' | 'reports' | 'settings';

const MarketMenu = ({ setView, onBack }: { setView: (view: MarketSubView) => void, onBack: () => void }) => {
    const menuItems = [
      { view: 'sales', label: 'Продажі', icon: BarChart3 },
      { view: 'remains', label: 'Залишки', icon: Package },
      { view: 'reports', label: 'Звіти', icon: FileText },
      { view: 'settings', label: 'Налаштування', icon: Settings },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
             <div className="flex items-center justify-center w-full max-w-md mb-10 mt-24 relative">
                <Button variant="ghost" onClick={onBack} className="absolute left-0"><ArrowLeft className="mr-2 h-4 w-4" /> Головне меню</Button>
                <h2 className="text-2xl font-bold">Маркет</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {menuItems.map((item) => (
                <button
                    key={item.view}
                    onClick={() => setView(item.view as MarketSubView)}
                    className="conn-hub-style h-32 !p-4 !rounded-3xl flex flex-col items-center justify-center text-center"
                >
                    <item.icon className="w-10 h-10 mb-2" />
                    <span className="text-base font-bold">{item.label}</span>
                </button>
                ))}
            </div>
        </div>
    );
};

export default function SalesAnalytics({ setView, isMobileSalesFilterOpen, onMobileSalesFilterOpenChange }: { 
    setView: (view: AppView) => void,
    isMobileSalesFilterOpen?: boolean,
    onMobileSalesFilterOpenChange?: (open: boolean) => void,
}) {
    const [currentMarketView, setCurrentMarketView] = useState<MarketSubView>('menu');
    const isMobile = useIsMobile();
    const { toast } = useToast();

    // --- Lifted State ---
    const [sales, setSales] = useState<ViewableSale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<SalesConfig | null>(null);
    const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
    const [currentMappingType, setCurrentMappingType] = useState<'categories' | 'sellers' | 'departments'>('categories');
    const [isWarningsDialogOpen, setIsWarningsDialogOpen] = useState(false);
    const [showAttentionColumn, setShowAttentionColumn] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');

    const fetchSalesData = async (date: Date, period: 'day' | 'week' | 'month') => {
        setIsLoading(true);
        try {
            const salesResult = await getSales(period, date);
            if (salesResult && salesResult.success && salesResult.data) {
                setSales(salesResult.data);
            } else {
                setSales([]);
                console.error("Failed to fetch sales:", salesResult?.error);
                toast({
                    variant: "destructive",
                    title: "Помилка завантаження продажів",
                    description: salesResult?.error || "Не вдалося отримати дані з RemOnline.",
                });
            }
        } catch (e: any) {
            setSales([]);
            toast({
                variant: "destructive",
                title: "Помилка з'єднання",
                description: e.message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const fetchInitialData = async () => {
            await fetchSalesData(selectedDate, selectedPeriod);

            const configResponse = await fetch('/api/sales-config');
            if (configResponse.ok) {
                setConfig(await configResponse.json());
            } else {
                toast({ variant: 'destructive', title: 'Помилка завантаження конфігурації' });
            }
        };

        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast]);
    
    const unmappedItems = useMemo(() => {
        if (!config || !sales || sales.length === 0) {
            return { categories: [], sellers: [], departments: [] };
        }
        
        const salesToReview = sales.filter(s => s.status === 'NEEDS_REVIEW');
        
        const unmappedTitles = salesToReview
            .filter(s => s.category === '--')
            .map(s => s.title);

        const sellerReasonPrefix = 'Невпізнаний продавець:';
        const departmentReasonPrefix = 'Невпізнаний відділ:';

        const unmappedSellers = salesToReview
            .flatMap(s => s.reviewReasons)
            .filter(reason => reason.startsWith(sellerReasonPrefix))
            .map(reason => reason.replace(sellerReasonPrefix, '').replace(/"/g, '').trim());
            
        const unmappedDepartments = salesToReview
             .flatMap(s => s.reviewReasons)
            .filter(reason => reason.startsWith(departmentReasonPrefix))
            .map(reason => reason.replace(departmentReasonPrefix, '').replace(/"/g, '').trim());

        return {
            categories: [...new Set(unmappedTitles)],
            sellers: [...new Set(unmappedSellers)],
            departments: [...new Set(unmappedDepartments)],
        };
    }, [sales, config]);

    const totalWarnings = useMemo(() => {
        return unmappedItems.categories.length + unmappedItems.sellers.length + unmappedItems.departments.length;
    }, [unmappedItems]);


    const handleConfigChange = async (newConfig: SalesConfig) => {
        setConfig(newConfig); // Optimistic update
        const result = await updateSalesConfig(newConfig);

        if (result && result.success) {
            await fetchSalesData(selectedDate, selectedPeriod); // Refetch sales data to apply new rules
            toast({ title: "Правила оновлено та застосовано." });
        } else {
            toast({
                variant: "destructive",
                title: "Помилка збереження налаштувань",
                description: result?.error || "Сталася невідома помилка.",
            });
            // Revert optimistic config update if save fails
            const configResponse = await fetch('/api/sales-config');
            if (configResponse.ok) {
                setConfig(await configResponse.json());
            }
        }
    };

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            fetchSalesData(date, selectedPeriod);
        }
    };

    const handlePeriodChange = (period: 'day' | 'week' | 'month') => {
        setSelectedPeriod(period);
        fetchSalesData(selectedDate, period);
    };
    
    const openMappingDialog = (type: 'categories' | 'sellers' | 'departments') => {
        setCurrentMappingType(type);
        setIsMappingDialogOpen(true);
    };

    if (isMobile === undefined) {
        return <div className="text-center p-10 h-[calc(100vh-280px)]">Завантаження...</div>;
    }

    if (isMobile) {
        return <LegacySalesAnalytics 
            onBack={() => setView('main-menu')}
            isFilterOpen={isMobileSalesFilterOpen}
            onFilterOpenChange={onMobileSalesFilterOpenChange}
        />;
    }

    const viewTitles: Record<MarketSubView, string> = {
        menu: 'Маркет',
        sales: 'Продажі',
        remains: 'Залишки',
        reports: 'Звіти',
        settings: 'Налаштування'
    };

    const renderCurrentView = () => {
        switch (currentMarketView) {
            case 'sales': return <SalesView
                sales={sales}
                isLoading={isLoading}
                config={config}
                showAttentionColumn={showAttentionColumn}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                period={selectedPeriod}
                onPeriodChange={handlePeriodChange}
            />;
            case 'remains': return <SalesRemainsView />;
            case 'reports': return <SalesReportsView config={config} />;
            case 'settings': return <SalesSettingsView />;
            case 'menu':
            default:
                return null;
        }
    };
    
    if (currentMarketView === 'menu') {
        return <Card className="bg-transparent border-none shadow-none h-screen"><MarketMenu setView={setCurrentMarketView} onBack={() => setView('main-menu')} /></Card>;
    }

    return (
        <div className="flex min-h-screen">
            {config && <MappingDialog 
                open={isMappingDialogOpen}
                onOpenChange={setIsMappingDialogOpen}
                type={currentMappingType}
                config={config}
                onConfigChange={handleConfigChange}
                unmappedItems={unmappedItems}
            />}
            <WarningsDialog
                open={isWarningsDialogOpen}
                onOpenChange={setIsWarningsDialogOpen}
                unmappedItems={unmappedItems}
                openMappingDialog={openMappingDialog}
                showAttentionColumn={showAttentionColumn}
                setShowAttentionColumn={setShowAttentionColumn}
            />
            <SidebarProvider>
                <Sidebar collapsible="icon">
                    <SalesSidebar
                        currentView={currentMarketView}
                        setView={setCurrentMarketView}
                        onBack={() => setView('main-menu')}
                        onMenuBack={() => setCurrentMarketView('menu')}
                    />
                </Sidebar>
                <SidebarInset className="p-0 flex flex-col !bg-card !m-0 !rounded-none min-h-screen">
                    <header className="flex-shrink-0 flex items-center gap-2 p-4 border-b">
                         <SidebarTrigger className="md:hidden" />
                        <h1 className="text-2xl font-bold">{viewTitles[currentMarketView]}</h1>
                    </header>
                    <main className="overflow-y-auto flex-grow">
                        {renderCurrentView()}
                    </main>
                </SidebarInset>
            </SidebarProvider>
            {totalWarnings > 0 && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button size="icon" className="rounded-full h-14 w-14 shadow-lg relative glass-btn-blue active" onClick={() => setIsWarningsDialogOpen(true)}>
                        <BellRing className="h-6 w-6" /> 
                        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white border-2 border-background">
                            {totalWarnings}
                        </span>
                    </Button>
                </div>
            )}
        </div>
    );
}