'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getCacheInfo, refreshAllCaches } from '@/app/actions/remonline-config';
import { useToast } from '@/hooks/use-toast';

const CacheInfoView = ({ onBack }: { onBack: () => void }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheData, setCacheData] = useState<any>(null);
    const [rawCategoriesResponse, setRawCategoriesResponse] = useState<string>('');
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        setRawCategoriesResponse('');
        getCacheInfo().then(result => {
            if (result.success) {
                setCacheData(result.data);
            } else {
                toast({ variant: 'destructive', title: 'Помилка завантаження кешу', description: result.error as string });
            }
            setIsLoading(false);
        });
    }, [toast]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setRawCategoriesResponse('');
        const result = await refreshAllCaches();
        if (result.success) {
            setCacheData(result.data);
            if (result.rawCategories) {
                setRawCategoriesResponse(JSON.stringify(result.rawCategories, null, 2));
            }
            toast({ title: 'Кеш успішно оновлено' });
        } else {
            toast({ variant: 'destructive', title: 'Помилка оновлення кешу', description: result.error as string });
            if ('rawCategories' in result && result.rawCategories) {
                setRawCategoriesResponse(JSON.stringify(result.rawCategories, null, 2));
            }
        }
        setIsRefreshing(false);
    };

    const renderList = (title: string, cacheItem: { last_updated: string, data: any[] } | null) => {
        const lastUpdated = cacheItem ? new Date(cacheItem.last_updated).toLocaleString('uk-UA') : 'Н/Д';
        const items = cacheItem?.data || [];
        
        return (
            <Card className="flex-1 min-w-[300px]">
                 <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        {items.length} записів, оновлено: {lastUpdated}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-60 rounded-md border">
                        <div className="p-2 text-sm">
                            {items.length > 0 ? items.map((item: any, index: number) => (
                                <div key={item.id || index} className="p-1 border-b border-border/50 truncate">{item.name || item.title}</div>
                            )) : <p className="p-2 text-muted-foreground">Немає даних</p>}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6 p-4">
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Інформація про кешовані дані</CardTitle>
                        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Назад до налаштувань</Button>
                    </div>
                    <CardDescription>
                        Тут відображаються списки сутностей, завантажені з RemOnline. Вони оновлюються раз на добу або примусово.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleRefresh} disabled={isRefreshing || isLoading}>
                        {(isRefreshing || isLoading) && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Завантаження...' : (isRefreshing ? 'Оновлення...' : 'Оновити зараз')}
                    </Button>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="text-center p-10">Завантаження...</div>
            ) : (
                <div className="flex flex-wrap gap-6">
                    {renderList("Локації (Branches)", cacheData?.infra ? { ...cacheData.infra, data: cacheData.infra.data.branches } : null)}
                    {renderList("Склади (Warehouses)", cacheData?.infra ? { ...cacheData.infra, data: cacheData.infra.data.warehouses } : null)}
                    {renderList("Категорії товарів", cacheData?.categories)}
                </div>
            )}

            {rawCategoriesResponse && (
                <Card>
                    <CardHeader>
                        <CardTitle>Відповідь від API для категорій (Debug)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-60 rounded-md border mt-2 bg-muted/50">
                            <pre className="p-4 text-xs whitespace-pre-wrap break-all">{rawCategoriesResponse}</pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default CacheInfoView;
