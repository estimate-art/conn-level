'use client';

import React, { useState, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowLeft, FileText, Send, ShoppingBag, UploadCloud } from 'lucide-react';
import type { OutletData, OutletGroup, ProcessedPrpData, ProcessedPopData, OutletDataMap, StatisticsView, AppView } from '@/lib/types';
import { findRelatedColumns } from '@/lib/excel-processor';
import { formatOutletName, cn } from '@/lib/utils';
import PerformanceCard from './performance-card';
import PacingSummary from './pacing-summary';
import PrpReportTable from './prp-report-table';
import PopReportTable from './pop-report-table';
import OutletFilter from './outlet-filter';
import FlexboxReport from './flexbox-report';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

type DesktopStatisticsDashboardProps = {
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    outlets: string[];
    outletGroups: OutletGroup[];
    prpData: ProcessedPrpData | null;
    popData: ProcessedPopData | null;
    setCurrentView: (view: StatisticsView) => void;
    setAppView: (view: AppView) => void;
    selectedOutlet: string;
    setSelectedOutlet: (o: string) => void;
    outletDataMap: OutletDataMap;
};

export default function DesktopStatisticsDashboard({
    onFileUpload,
    outlets,
    outletGroups,
    prpData,
    popData,
    setCurrentView,
    setAppView,
    selectedOutlet,
    setSelectedOutlet,
    outletDataMap,
}: DesktopStatisticsDashboardProps) {
    const [desktopView, setDesktopView] = useState<'main' | 'flexbox'>('main');
    const [selectedDesktopOutlets, setSelectedDesktopOutlets] = useState<string[]>([]);

    const currentOutletPerformance = outletDataMap.get(selectedOutlet);
    const relatedCols = useMemo(() => {
        if (!currentOutletPerformance) return {};
        const headers = Object.keys(currentOutletPerformance.rawData);
        return findRelatedColumns(headers);
    }, [currentOutletPerformance]);

    const handleToggleDesktopOutlet = (outlet: string) => {
        if (outlet === '__RESET__') {
            setSelectedDesktopOutlets([]);
            return;
        }
        setSelectedDesktopOutlets(prev => prev.includes(outlet) ? prev.filter(o => o !== outlet) : [...prev, outlet]);
    };

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center justify-between p-2">
                         <h2 className="text-xl font-bold group-data-[collapsible=icon]:hidden">Статистика</h2>
                         <SidebarTrigger />
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <Card className="bg-transparent border-none shadow-none flex-grow flex flex-col">
                        <CardHeader className="p-2 pt-0">
                            <CardTitle className="text-base">Аутлети</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-hidden p-2">
                            <ScrollArea className="h-full">
                                <div className="flex flex-col gap-2 pr-2">
                                    {outletGroups.map(group => (
                                        <div key={group.fileName}>
                                            <h4 className="text-sm font-semibold text-muted-foreground mb-2 break-words">{group.fileName}</h4>
                                            {group.outlets.map(outlet => (
                                                <Button key={outlet} onClick={() => setSelectedOutlet(outlet)} variant={selectedOutlet === outlet ? 'default' : 'secondary'} size="sm" className="w-full justify-start mb-1 text-left h-auto py-1 px-2">
                                                    {formatOutletName(outlet)}
                                                </Button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </SidebarContent>
                <SidebarFooter>
                     <label htmlFor="desktop-file-upload" className={cn(buttonVariants({ variant: 'ghost' }), "w-full justify-start")}>
                        <UploadCloud />
                        <span className="group-data-[collapsible=icon]:hidden pl-2">Імпорт</span>
                    </label>
                    <input id="desktop-file-upload" type="file" accept=".xlsx, .xls" onChange={onFileUpload} className="hidden" multiple />

                    <SidebarMenu>
                         <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => setCurrentView('orders')} className="justify-start">
                                <ShoppingBag /> <span className="group-data-[collapsible=icon]:hidden">Замовлення</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => setCurrentView('sms-form')} className="justify-start">
                                <Send /> <span className="group-data-[collapsible=icon]:hidden">Надіслати запит</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => setAppView('main-menu')} className="justify-start">
                                <ArrowLeft /> <span className="group-data-[collapsible=icon]:hidden">Головне меню</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="p-6">
                <main className="overflow-y-auto">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                             <h1 className="text-2xl font-bold">
                                {desktopView === 'flexbox' ? 'FLEXBOX Звіт' : 'Огляд'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={() => setDesktopView('main')} variant={desktopView === 'main' ? 'default' : 'outline'}>Основний звіт</Button>
                             <Button onClick={() => setDesktopView('flexbox')} variant={desktopView === 'flexbox' ? 'default' : 'outline'}>FLEXBOX</Button>
                        </div>
                    </div>
                    {desktopView === 'main' && (
                        <div className="space-y-4">
                            <div className="mx-auto max-w-[calc(100%-4rem)]">
                                <div className="grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
                                    {currentOutletPerformance ? currentOutletPerformance.factData
                                        .filter(item => item.category !== 'NBO')
                                        .map((item, index) => (
                                            <div key={index} className="h-[108px]">
                                                <PerformanceCard item={item} />
                                            </div>
                                        )) : <p>Оберіть аутлет для перегляду статистики.</p>
                                    }
                                </div>
                            </div>
                            
                            {currentOutletPerformance && (
                                <>
                                    <div className="flex justify-center">
                                        <PacingSummary outletRawData={currentOutletPerformance.rawData} relatedCols={relatedCols} />
                                    </div>
                                    <div className="bg-card/50 p-4 rounded-lg">
                                        <OutletFilter outlets={outlets} selectedOutlets={selectedDesktopOutlets} onToggle={handleToggleDesktopOutlet} title="Фільтр звітів" />
                                    </div>
                                </>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <div className="flex-grow p-2" style={{flexBasis: '400px', minWidth: '350px'}}>
                                    {popData && <PopReportTable popData={popData} selectedOutlets={selectedDesktopOutlets} />}
                                </div>
                                <div className="flex-grow p-2" style={{flexBasis: '400px', minWidth: '350px'}}>
                                    {prpData && <PrpReportTable prpData={prpData} selectedOutlets={selectedDesktopOutlets} />}
                                </div>
                            </div>
                        </div>
                    )}
                    {desktopView === 'flexbox' && (
                        <FlexboxReport outlets={outlets} outletDataMap={outletDataMap} />
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};
