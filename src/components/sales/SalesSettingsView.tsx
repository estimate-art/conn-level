'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Calendar as CalendarIcon, ShieldCheck, Settings, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { testApiConnection, updateSalesConfig, debugApiRequest, checkApiKeyStatus } from '@/app/actions/remonline-config';
import { getSales } from '@/app/actions/remonline-sales';
import { Calendar } from '@/components/ui/calendar';
import type { SalesConfig, ViewableSale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import MappingDialog from './MappingDialog';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import CacheInfoView from './CacheInfoView';

const SearchSettingsConstructor = ({ onBack }: { onBack: () => void }) => {
    const [apiUrl, setApiUrl] = useState('https://api.remonline.app/products/?token={API_KEY}&q=');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!apiUrl.trim()) {
            toast({ variant: 'destructive', title: 'URL не може бути порожнім' });
            return;
        }
        setIsLoading(true);
        setResult('');
        const res = await debugApiRequest(apiUrl);
        if (res.success) {
            setResult(JSON.stringify(res.data, null, 2));
        } else {
            const errorMessage = typeof res.error === 'string' ? res.error : JSON.stringify(res.error, null, 2);
            setResult(`Error: ${errorMessage}`);
            toast({ variant: 'destructive', title: 'Помилка запиту', description: errorMessage });
        }
        setIsLoading(false);
    };

    return (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                     <CardTitle>Конструктор запитів API</CardTitle>
                     <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Назад</Button>
                </div>
                 <CardDescription>Введіть URL для запиту до RemOnline API. Використовуйте {'{API_KEY}'} як плейсхолдер.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} rows={4} placeholder="e.g. https://api.remonline.app/clients/?token={API_KEY}" />
                <Button onClick={handleSend} disabled={isLoading}>{isLoading ? 'Відправка...' : 'Відправити запит'}</Button>
                <h4 className="font-semibold pt-4">Результат:</h4>
                <ScrollArea className="h-96 rounded-md border bg-muted/50">
                    <pre className="p-4 text-xs whitespace-pre-wrap break-all">{result || 'Результати з\'являться тут.'}</pre>
                </ScrollArea>
            </CardContent>
         </Card>
    );
}

export default function SalesSettingsView() {
    const [page, setPage] = useState('main');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [testResult, setTestResult] = useState<any | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isTestResultDialogOpen, setIsTestResultDialogOpen] = useState(false);
    
    const [apiKeyInfo, setApiKeyStatus] = useState<{ configured: boolean, message: string, suffix?: string }>({ configured: false, message: 'Перевірка статусу...' });
    
    const { toast } = useToast();

    // Dictionaries State
    const [config, setConfig] = useState<SalesConfig | null>(null);
    const [salesForMapping, setSalesForMapping] = useState<ViewableSale[]>([]);

    // Dialog states
    const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
    const [currentMappingType, setCurrentMappingType] = useState<'categories' | 'sellers' | 'departments'>('categories');
    
     useEffect(() => {
        const fetchInitialData = async () => {
            const [configResponse, salesResult, status] = await Promise.all([
                fetch('/api/sales-config'),
                getSales('day'),
                checkApiKeyStatus()
            ]);

            if (configResponse.ok) {
                const configData = await configResponse.json();
                setConfig(configData);
            }

            if (salesResult.success && salesResult.data) {
                setSalesForMapping(salesResult.data);
            }
            
            setApiKeyStatus(status);
        };

        fetchInitialData();
    }, []);
    
    const unmappedItems = useMemo(() => {
        if (!config || !salesForMapping || salesForMapping.length === 0) {
            return { categories: [], sellers: [], departments: [] };
        }
        
        const salesToReview = salesForMapping.filter(s => s.status === 'NEEDS_REVIEW');
        const unmappedTitles = salesToReview.filter(s => s.category === '--').map(s => s.title);
        const sellerReasonPrefix = 'Невпізнаний продавець:';
        const departmentReasonPrefix = 'Невпізнаний відділ:';

        const unmappedSellers = salesToReview.flatMap(s => s.reviewReasons).filter(reason => reason.startsWith(sellerReasonPrefix)).map(reason => reason.replace(sellerReasonPrefix, '').replace(/"/g, '').trim());
        const unmappedDepartments = salesToReview.flatMap(s => s.reviewReasons).filter(reason => reason.startsWith(departmentReasonPrefix)).map(reason => reason.replace(departmentReasonPrefix, '').replace(/"/g, '').trim());

        return {
            categories: [...new Set(unmappedTitles)],
            sellers: [...new Set(unmappedSellers)],
            departments: [...new Set(unmappedDepartments)],
        };
    }, [salesForMapping, config]);


    const handleTestConnection = async () => {
        if (!selectedDate) return;
        setIsTesting(true);
        try {
            const result = await testApiConnection(selectedDate);
            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, error: { message: 'Сталася невідома помилка.' } });
        } finally {
            setIsTesting(false);
            setIsTestResultDialogOpen(true);
        }
    };

    const handleSaveChanges = async () => {
        if (!config) return;
        const result = await updateSalesConfig(config);
        if (result.success) {
            toast({ title: "Налаштування успішно збережено." });
        } else {
            toast({ variant: "destructive", title: "Помилка збереження", description: result.error });
        }
    };

    const openMappingDialog = (type: 'categories' | 'sellers' | 'departments') => {
        setCurrentMappingType(type);
        setIsMappingDialogOpen(true);
    };

    const handleConfigChange = (newConfig: SalesConfig) => {
        setConfig(newConfig);
    }
    
    if (page === 'search-constructor') {
        return <SearchSettingsConstructor onBack={() => setPage('main')} />;
    }

    if (page === 'cache-info') {
        return <CacheInfoView onBack={() => setPage('main')} />;
    }
    
    if (!config) {
        return <div className="p-8 text-center">Завантаження налаштувань...</div>;
    }

    return (
        <div className="space-y-6 p-4">
            {isMappingDialogOpen && <MappingDialog 
                open={isMappingDialogOpen}
                onOpenChange={setIsMappingDialogOpen}
                type={currentMappingType}
                config={config}
                onConfigChange={handleConfigChange}
                unmappedItems={unmappedItems}
            />}

            <Card>
                <CardHeader>
                    <CardTitle>Статус API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className={cn(
                         "rounded-lg border p-4 space-y-3",
                         apiKeyInfo.configured ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"
                     )}>
                         <div className="flex items-start gap-4">
                             <div className={cn(
                                 "p-2 rounded-full",
                                 apiKeyInfo.configured ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                             )}>
                                {apiKeyInfo.configured ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">{apiKeyInfo.configured ? "API-ключ активний" : "Помилка конфігурації"}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {apiKeyInfo.message}
                                </p>
                                {apiKeyInfo.suffix && (
                                    <div className="mt-3 flex items-center gap-2 text-xs font-mono bg-black/20 p-2 rounded border border-white/5 w-fit">
                                        <Key className="h-3 w-3" />
                                        <span>Суфікс ключа: ...{apiKeyInfo.suffix}</span>
                                    </div>
                                )}
                            </div>
                         </div>
                    </div>
                     <div className="space-y-2 rounded-lg border p-4">
                        <h4 className="font-semibold">Тестування</h4>
                        <div className="flex items-center gap-2 pt-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[200px] justify-start text-left font-normal h-9">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "dd.MM.yyyy") : <span>Дата</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <Button size="sm" onClick={handleTestConnection} disabled={isTesting || !apiKeyInfo.configured}>
                                {isTesting ? 'Зачекайте...' : 'Тест запиту'}
                            </Button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPage('cache-info')}>Склади та Категорії</Button>
                        <Button size="sm" variant="outline" onClick={() => setPage('search-constructor')}>Конструктор API</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Словники</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium">Правила категорій</span>
                            <Button variant="ghost" size="icon" onClick={() => openMappingDialog('categories')}><Settings className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium">Псевдоніми продавців</span>
                            <Button variant="ghost" size="icon" onClick={() => openMappingDialog('sellers')}><Settings className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium">Ключі відділів</span>
                            <Button variant="ghost" size="icon" onClick={() => openMappingDialog('departments')}><Settings className="h-4 w-4" /></Button>
                        </div>
                        <Button onClick={handleSaveChanges} className="w-full mt-4">Зберегти словники</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Конфігурація таблиці</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {(config.tableColumns || []).map(col => (
                                <div key={col.accessor} className="flex justify-between items-center text-xs border-b py-2">
                                    <span className="font-medium">{col.header}</span>
                                    <code className="text-muted-foreground bg-muted px-1 rounded">{col.accessor}</code>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={isTestResultDialogOpen} onOpenChange={setIsTestResultDialogOpen}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Результат тесту</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <ScrollArea className="mt-2 h-[400px] rounded-md bg-muted p-4 text-xs">
                                <pre className="whitespace-pre-wrap font-mono">
                                    {JSON.stringify(testResult, null, 2)}
                                </pre>
                            </ScrollArea>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button onClick={() => setIsTestResultDialogOpen(false)}>Закрити</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
