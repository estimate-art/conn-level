
'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowLeft, UploadCloud, FileCog, X, RefreshCw } from 'lucide-react';
import type { OrderData, OrderColumnMapping } from '@/lib/types';
import { processOrderFile } from '@/lib/order-processor';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ORDER_DATA_STORAGE_KEY = 'orderData';
const ORDER_COLUMN_MAPPING_STORAGE_KEY = 'orderColumnMapping';

const DEFAULT_MAPPING: OrderColumnMapping = {
    headerRow: 8,
    code: 'Код',
    name: 'Асортимент',
    quantity: 'К-сть',
    priceColumn: 'F',
};


type OrderViewProps = {
  onBack: () => void;
  orderData: OrderData[];
  setOrderData: (data: OrderData[]) => void;
  fileName: string | null;
  setFileName: (name: string | null) => void;
};


export default function OrderView({ onBack, orderData, setOrderData, fileName, setFileName }: OrderViewProps) {
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [columnMapping, setColumnMapping] = useState<OrderColumnMapping>(DEFAULT_MAPPING);
    
    const [brandFilter, setBrandFilter] = useState<string[]>([]);
    const [memoryFilter, setMemoryFilter] = useState<string[]>([]);

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const savedMapping = localStorage.getItem(ORDER_COLUMN_MAPPING_STORAGE_KEY);
            if (savedMapping) {
                setColumnMapping(JSON.parse(savedMapping));
            } else {
                localStorage.setItem(ORDER_COLUMN_MAPPING_STORAGE_KEY, JSON.stringify(DEFAULT_MAPPING));
            }
        } catch (e) {
            console.error("Failed to load mapping from localStorage", e);
        }
    }, []);

    const handleMappingChange = (field: keyof OrderColumnMapping, value: string | number) => {
        const newMapping = { ...columnMapping, [field]: value };
        setColumnMapping(newMapping);
        localStorage.setItem(ORDER_COLUMN_MAPPING_STORAGE_KEY, JSON.stringify(newMapping));
        toast({ title: "Налаштування оновлено." });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatusMessage('Читання файлу...');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const fileBinaryString = e.target?.result as string;
                setStatusMessage('Обробка даних...');
                const processedData = await processOrderFile(fileBinaryString, columnMapping);
                setOrderData(processedData);
                setFileName(file.name);
                
                localStorage.setItem(ORDER_DATA_STORAGE_KEY, JSON.stringify({ data: processedData, name: file.name }));
                
                toast({ title: "Дані замовлення успішно завантажено." });
                setStatusMessage(`Обробка завершена. Знайдено ${processedData.length} позицій.`);

            } catch (error: any) {
                console.error("Помилка під час завантаження файлу:", error);
                toast({ variant: "destructive", title: "Помилка завантаження", description: error.message });
                setStatusMessage(`Помилка: ${error.message}`);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleClearData = () => {
        setOrderData([]);
        setFileName(null);
        setStatusMessage("Дані очищено. Завантажте новий файл.");
        localStorage.removeItem(ORDER_DATA_STORAGE_KEY);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast({ title: "Дані та ім'я файлу очищено." });
    };

    const totalSum = React.useMemo(() => {
        return orderData.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }, [orderData]);


    return (
        <div className="space-y-4 h-screen flex flex-col">
             <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="conn-hub-style !p-6 !bg-gradient-to-br from-[--glass-blue-top] to-[--glass-blue-bottom] !border-white/20">
                    <DialogHeader>
                        <DialogTitle>Налаштування парсингу замовлення</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                       <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="headerRow" className="text-right font-medium">Рядок заголовків</Label>
                            <Input id="headerRow" type="number" value={columnMapping.headerRow} onChange={e => handleMappingChange('headerRow', parseInt(e.target.value, 10))} className="col-span-2" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="codeCol" className="text-right font-medium">Стовпець "Код"</Label>
                            <Input id="codeCol" value={columnMapping.code || ''} onChange={e => handleMappingChange('code', e.target.value)} className="col-span-2" />
                        </div>
                         <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="nameCol" className="text-right font-medium">Стовпець "Асортимент"</Label>
                            <Input id="nameCol" value={columnMapping.name || ''} onChange={e => handleMappingChange('name', e.target.value)} className="col-span-2" />
                        </div>
                         <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="quantityCol" className="text-right font-medium">Стовпець "К-сть"</Label>
                            <Input id="quantityCol" value={columnMapping.quantity || ''} onChange={e => handleMappingChange('quantity', e.target.value)} className="col-span-2" />
                        </div>
                         <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="priceColumn" className="text-right font-medium">Стовпець "Ціна" (літера)</Label>
                            <Input id="priceColumn" value={columnMapping.priceColumn} onChange={e => handleMappingChange('priceColumn', e.target.value.toUpperCase())} className="col-span-2" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsSettingsOpen(false)}>Готово</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="conn-hub-style !bg-gradient-to-br from-black/20 to-black/30 !border-none !shadow-none sticky top-0 z-10 !rounded-none md:!rounded-xl flex-shrink-0">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                                <ArrowLeft />
                            </Button>
                            <div>
                                <CardTitle>Бланк замовлення</CardTitle>
                                {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsSettingsOpen(true)}>
                                <FileCog />
                            </Button>
                            <label htmlFor="order-file-upload" className="cursor-pointer">
                                <div className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-9 w-9")}>
                                    <UploadCloud />
                                </div>
                            </label>
                            <input id="order-file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                            {fileName && (
                                <Button variant="destructive" size="icon" className="h-9 w-9" onClick={handleClearData}>
                                    <X/>
                                </Button>
                            )}
                        </div>
                    </div>
                     {statusMessage && (
                        <CardDescription className="mt-2 text-center text-xs conn-hub-style !p-2 !rounded-lg w-full">
                            {statusMessage}
                        </CardDescription>
                    )}
                    <CardDescription className="mt-2 text-center text-xs text-muted-foreground font-mono">
                        Координати: [Рядок: {columnMapping.headerRow}], [Код: '{columnMapping.code}'], [Асортимент: '{columnMapping.name}'], [К-сть: '{columnMapping.quantity}'], [Ціна: '{columnMapping.priceColumn}']
                    </CardDescription>
                </CardHeader>
                {orderData.length > 0 && (
                     <CardContent className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Пам'ять:</h4>
                            <div className="flex flex-wrap gap-2">
                                {['64', '128', '256'].map(mem => (
                                    <Button key={mem} size="sm" variant={memoryFilter.includes(mem) ? 'default' : 'secondary'} onClick={() => setMemoryFilter(prev => prev.includes(mem) ? prev.filter(f => f !== mem) : [...prev, mem])} className="h-7">
                                        {mem} ГБ
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            <div className="px-4 md:px-0 flex-grow h-0 pb-4">
                <ScrollArea className="h-full w-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Асортимент</TableHead>
                                <TableHead>Бренд</TableHead>
                                <TableHead className="text-right">К-сть</TableHead>
                                <TableHead className="text-right">Ціна</TableHead>
                                <TableHead className="text-right">Сума</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderData.length > 0 ? (
                                orderData.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.brand}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold">{(item.quantity * item.price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                       {fileName ? "Нічого не знайдено за вашими фільтрами." : "Дані відсутні. Завантажте файл."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} className="text-right font-bold text-lg">Загальна сума</TableCell>
                                <TableCell className="text-right font-bold text-2xl">
                                    {totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
}

    
