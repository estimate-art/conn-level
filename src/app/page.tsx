
"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { OutletData, OutletGroup, StatisticsView, AppView, OrderData } from '@/lib/types';
import { processPrpData, processPopData } from '@/lib/excel-processor';

import MainMenu from '@/components/layout/main-menu';
import StatisticsDashboard from '@/components/layout/statistics-dashboard';
import SmsForm from '@/components/layout/sms-form';
import SalesAnalytics from '@/components/layout/sales-analytics';
import BottomNavBar from '@/components/layout/bottom-nav-bar';
import MobileLoader from '@/components/layout/mobile-loader';

import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';


const LOCAL_STORAGE_KEY = 'analyticsData';
const ORDER_DATA_STORAGE_KEY = 'orderData';
const EXPERIMENTAL_FLAG_KEY = 'showExperimentalFeatures';


export default function Home() {
  const [data, setData] = useState<OutletData[]>([]);
  const [outlets, setOutlets] = useState<string[]>([]);
  const [outletGroups, setOutletGroups] = useState<OutletGroup[]>([]);
  const [prpData, setPrpData] = useState<any>(null);
  const [popData, setPopData] = useState<any>(null);
  const [orderData, setOrderData] = useState<OrderData[]>([]);
  const [orderFileName, setOrderFileName] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('main-menu');
  const [statisticsView, setStatisticsView] = useState<StatisticsView>('menu');
  const [importDate, setImportDate] = useState<string | null>(null);
  const [showExperimental, setShowExperimental] = useState(false);
  
  const [isMobileSalesFilterOpen, setIsMobileSalesFilterOpen] = useState(false);

  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
          console.log('Service Worker registration successful with scope: ', registration.scope);
        }, function(err) {
          console.log('Service Worker registration failed: ', err);
        });
      });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const { data, outlets, outletGroups, prpData, popData, date } = JSON.parse(savedData);
        setData(data);
        setOutlets(outlets);
        setOutletGroups(outletGroups);
        setPrpData(prpData);
        setPopData(popData);
        setImportDate(date);
        toast({ title: "Дані статистики успішно завантажено з кешу.", duration: 1500 });
      }

      const savedOrderData = localStorage.getItem(ORDER_DATA_STORAGE_KEY);
        if (savedOrderData) {
            const { data, name } = JSON.parse(savedOrderData);
            setOrderData(data);
            setOrderFileName(name);
            toast({ title: "Дані замовлення завантажено з кешу.", duration: 1500 });
        }
        
      const experimentalFlag = localStorage.getItem(EXPERIMENTAL_FLAG_KEY);
      setShowExperimental(experimentalFlag === 'true');

    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      setError("Помилка завантаження збережених даних.");
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(ORDER_DATA_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (currentView === 'sms-form') {
      document.body.classList.add('sms-active-bg');
    } else {
      document.body.classList.remove('sms-active-bg');
    }
  }, [currentView]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    
    // Clear old data immediately
    clearAllData(false);

    let mainReportData: OutletData[] = [];
    let prpReportRawData: any[] = [];
    let popReportRawData: any[] = [];
    let processedFiles = 0;
    let tempOutletGroups: OutletGroup[] = [];
    let prpFound = false;
    let popFound = false;

    const prpRegex = /[PpРр][RrРр][PpРр]/i;
    const popRegex = /[PpРр][OoОо][PpРр]/i;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const bstr = event.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });

          const mainReportSheetName = workbook.SheetNames[0];
          if (mainReportSheetName) {
            const ws = workbook.Sheets[mainReportSheetName];
            const pD = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
            if (pD.length > 0) {
              const headers = pD[0];
              const rows = pD.slice(1);
              const mappedData = rows.map(row => {
                const rowData: OutletData = {};
                headers.forEach((header: string, index: number) => {
                  rowData[header] = row[index];
                });
                return rowData;
              });
              mainReportData = [...mainReportData, ...mappedData];

              const outletsFromFile = [...new Set(mappedData.map(row => row['Аутлет'] as string))].filter(Boolean).sort();
              if (outletsFromFile.length > 0) {
                tempOutletGroups.push({ fileName: file.name, outlets: outletsFromFile });
              }
            }
          }

          const prpSheetName = workbook.SheetNames.find(name => prpRegex.test(name));
          if (prpSheetName) {
            prpFound = true;
            prpReportRawData = [...prpReportRawData, ...XLSX.utils.sheet_to_json(workbook.Sheets[prpSheetName])];
          }
          const popSheetName = workbook.SheetNames.find(name => popRegex.test(name));
          if (popSheetName) {
            popFound = true;
            popReportRawData = [...popReportRawData, ...XLSX.utils.sheet_to_json(workbook.Sheets[popSheetName])];
          }
        } catch (e) {
          setError("Помилка обробки файлу. Будь ласка, переконайтеся, що це дійсний файл Excel.");
          console.error(e);
        } finally {
          processedFiles++;
          if (processedFiles === files.length) {
            const newPrpData = prpReportRawData.length > 0 ? processPrpData(prpReportRawData) : null;
            const newPopData = popReportRawData.length > 0 ? processPopData(popReportRawData) : null;
            const allUniqueOutlets = [...new Set(mainReportData.map(row => row['Аутлет'] as string))].filter(Boolean);
            const currentDate = new Date().toISOString();

            setData(mainReportData);
            setOutletGroups(tempOutletGroups);
            setOutlets(allUniqueOutlets);
            setPrpData(newPrpData);
            setPopData(newPopData);
            setImportDate(currentDate);

            try {
              const dataToSave = {
                data: mainReportData,
                outlets: allUniqueOutlets,
                outletGroups: tempOutletGroups,
                prpData: newPrpData,
                popData: newPopData,
                date: currentDate,
              };
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
              toast({ title: "Дані успішно імпортовано та збережено.", duration: 2000 });
            } catch (err) {
                console.error("Failed to save data to localStorage", err);
                toast({ variant: "destructive", title: "Не вдалося зберегти дані в кеш.", description: "Можливо, перевищено ліміт сховища.", duration: 3000 });
            }
            
            if (newPrpData) {
              toast({ title: "Звіт PrP успішно згенеровано.", duration: 2000 });
            } else if (prpFound) {
                 toast({ variant: "destructive", title: "Дані для звіту PrP не знайдено.", description: "Аркуш 'PrP' знайдено, але він порожній.", duration: 2000 });
            } else {
                 toast({ variant: "destructive", title: "Аркуш для звіту PrP не знайдено.", duration: 2000 });
            }
            if (newPopData) {
              toast({ title: "Звіт PoP успішно згенеровано.", duration: 2000 });
            } else if (popFound) {
                 toast({ variant: "destructive", title: "Дані для звіту PoP не знайдено.", description: "Аркуш 'PoP' знайдено, але він порожній.", duration: 2000 });
            } else {
                 toast({ variant: "destructive", title: "Аркуш для звіту PoP не знайдено.", duration: 2000 });
            }

            setLoading(false);
          }
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const clearAllData = (showToast = true) => {
    setData([]);
    setOutlets([]);
    setOutletGroups([]);
    setPrpData(null);
    setPopData(null);
    setImportDate(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    setOrderData([]);
    setOrderFileName(null);
    localStorage.removeItem(ORDER_DATA_STORAGE_KEY);
    
    if (showToast) {
        toast({ title: "Збережені дані очищено.", duration: 2000 });
    }
  };

  const setView = (view: AppView) => {
    setCurrentView(view);
    if (view === 'statistics') {
      setStatisticsView('menu');
    }
  }
  
  const handleExperimentalToggle = (checked: boolean) => {
      setShowExperimental(checked);
      localStorage.setItem(EXPERIMENTAL_FLAG_KEY, String(checked));
  }

  const renderContent = () => {
    switch(currentView) {
      case 'statistics':
        return (
          <StatisticsDashboard
            onFileUpload={handleFileUpload}
            data={data}
            outlets={outlets}
            outletGroups={outletGroups}
            prpData={prpData}
            popData={popData}
            orderData={orderData}
            setOrderData={setOrderData}
            orderFileName={orderFileName}
            setOrderFileName={setOrderFileName}
            loading={loading}
            error={error}
            currentView={statisticsView}
            setCurrentView={setStatisticsView}
            setAppView={setView}
            importDate={importDate}
            clearCache={clearAllData}
            showExperimental={showExperimental}
          />
        );
      case 'sms-form':
        return <SmsForm />;
      case 'sales':
        return <SalesAnalytics setView={setView} isMobileSalesFilterOpen={isMobileSalesFilterOpen} onMobileSalesFilterOpenChange={setIsMobileSalesFilterOpen} />;
      case 'main-menu':
      default:
        return <MainMenu setView={setView} />;
    }
  };

  const showLoader = loading && isMobile;
  const isSalesAnalytics = currentView === 'sales';
  const isOrderView = currentView === 'statistics' && statisticsView === 'orders';
  const isReportView = currentView === 'statistics' && (statisticsView === 'prp-report' || statisticsView === 'pop-report');

  const mainContainerPaddingClass = isMobile ? "pb-[120px]" : "pb-4";

  return (
    <div className={cn(
      "min-h-screen text-foreground font-sans flex flex-col items-center",
      isSalesAnalytics ? null : cn(!isOrderView && "p-4"),
      isSalesAnalytics ? (isMobile ? "pb-[120px]" : null) : mainContainerPaddingClass,
      (isSalesAnalytics || isReportView) && !isOrderView && "px-0 md:px-4"
    )}>
       <BottomNavBar 
          currentView={currentView} 
          setView={setView}
          onFilterClick={() => setIsMobileSalesFilterOpen(true)}
       />
      <div className={cn(
          "w-full max-w-7xl relative",
          (isSalesAnalytics || isReportView || isOrderView) && "max-w-full",
          (currentView === 'statistics' && isMobile === false) && "max-w-full"
      )}>
        {currentView === 'main-menu' && (
            <Dialog>
                 <DialogTrigger asChild>
                     <button className={cn("conn-hub-style absolute top-0 right-0 z-20 h-5 w-5 p-0 flex items-center justify-center rounded-full")}>
                        <Settings className="text-transparent" />
                    </button>
                </DialogTrigger>
                <DialogContent className="conn-hub-style !p-6 !bg-gradient-to-br from-[--glass-blue-top] to-[--glass-blue-bottom] !border-white/20">
                    <DialogHeader>
                        <DialogTitle>Налаштування</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <Switch id="experimental-mode" checked={showExperimental} onCheckedChange={handleExperimentalToggle} />
                        <Label htmlFor="experimental-mode">Experimental</Label>
                    </div>
                </DialogContent>
            </Dialog>
        )}
        
        <main>
           <Card className={cn(
            "border-none shadow-none bg-transparent"
          )}>
            <CardContent className={cn(
                "p-4 sm:p-6",
                showLoader && "h-[calc(100vh-140px)]",
                (showLoader) && "p-0",
                currentView === 'main-menu' && '!p-0',
                currentView === 'sms-form' && '!bg-transparent',
                (isSalesAnalytics || isReportView || isOrderView) && '!p-0'
            )}>
               {showLoader ? <MobileLoader /> : renderContent()}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
