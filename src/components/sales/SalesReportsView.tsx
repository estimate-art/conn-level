'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, X, ArrowUp, ArrowDown, List, BarChart2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from 'date-fns';
import { getSalesForCustomPeriod } from '@/app/actions/remonline-sales';
import { useToast } from '@/hooks/use-toast';
import type { ViewableSale, SalesConfig } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ReportBlock = ({ title, data }: { title: string, data: { name: string, total: number }[] }) => {
    return (
        <Card className="border-white/5 bg-black/10">
            <CardHeader className="p-4">
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <ScrollArea className="h-[60vh]">
                    <div className="space-y-1.5 pr-2">
                        {data && data.length > 0 ? data.map(item => (
                            <div key={item.name} className="flex justify-between items-center gap-2 p-2 rounded-md bg-muted/30 border border-white/5">
                                <p className="font-medium text-sm truncate flex-1" title={item.name}>{item.name}</p>
                                <p className="font-mono font-bold text-sm whitespace-nowrap bg-background/50 px-2 py-0.5 rounded">
                                    {Math.round(item.total).toLocaleString('uk-UA')}
                                </p>
                            </div>
                        )) : <p className="text-muted-foreground text-center pt-10 text-sm">Дані відсутні</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

const FilterPopover = ({ title, items, selectedItems, onToggle, onClear }: {
    title: string;
    items: string[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    onClear: () => void;
}) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                    {title} {selectedItems.length > 0 && `(${selectedItems.length})`}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <div className="p-2 border-b bg-muted/50">
                    <h4 className="font-medium text-sm">{title}</h4>
                </div>
                <ScrollArea className="h-64">
                    <div className="p-2 space-y-1">
                        {items && items.length > 0 ? items.map(item => (
                            <div key={item} className="flex items-center space-x-2 p-1 rounded hover:bg-accent/50 cursor-pointer">
                                <Checkbox
                                    id={`${title}-${item}`}
                                    checked={selectedItems.includes(item)}
                                    onCheckedChange={() => onToggle(item)}
                                />
                                <Label htmlFor={`${title}-${item}`} className="font-normal text-sm w-full cursor-pointer truncate">{item}</Label>
                            </div>
                        )) : <p className="text-xs text-center py-4 opacity-50">Нічого не знайдено</p>}
                    </div>
                </ScrollArea>
                {selectedItems.length > 0 && (
                    <div className="p-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full justify-center text-destructive" onClick={onClear}>
                            Скинути вибір
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
};

const getRowClass = (category: string) => {
    switch (category) {
        case 'Скло': return 'bg-blue-500/10 hover:bg-blue-500/20';
        case 'ДУ': return 'bg-purple-500/10 hover:bg-purple-500/20';
        case 'Чохол': return 'bg-green-500/10 hover:bg-green-500/20';
        case 'DEMO': return 'bg-orange-500/10 hover:bg-orange-500/20';
        default: return 'even:bg-muted/30';
    }
};

export default function SalesReportsView({ config }: { config: SalesConfig | null }) {
    const [period, setPeriod] = useState('month');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [salesData, setSalesData] = useState<ViewableSale[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ViewableSale; direction: 'asc' | 'desc' } | null>({ key: 'timestamp', direction: 'desc' });

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod);
        const now = new Date();
        if (newPeriod === 'day') {
            setDateRange({ from: now, to: now });
        } else if (newPeriod === 'week') {
            setDateRange({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) });
        } else if (newPeriod === 'month') {
            setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        }
    };

    const handleGenerateReport = async () => {
        if (!dateRange?.from) {
            toast({ variant: 'destructive', title: 'Оберіть дату' });
            return;
        }
        setIsLoading(true);
        const toDate = dateRange.to || dateRange.from;
        
        try {
            const result = await getSalesForCustomPeriod(dateRange.from, toDate);
            
            if (result && result.success) {
                setSalesData(result.data || []);
                toast({ title: 'Оновлено', description: `Завантажено ${result.count || 0} записів.`});
            } else {
                setSalesData([]);
                toast({ 
                    variant: 'destructive', 
                    title: 'Помилка', 
                    description: result?.error || "Сервер не повернув дані" 
                });
            }
        } catch (e: any) {
            setSalesData([]);
            toast({ variant: 'destructive', title: 'Помилка мережі', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        handleGenerateReport();
    }, []);

    const { departments, sellers, categories } = useMemo(() => {
        if (!salesData) return { departments: [], sellers: [], categories: [] };
        return {
            departments: [...new Set(salesData.map(s => s.department))].sort(),
            sellers: [...new Set(salesData.map(s => s.seller))].sort(),
            categories: [...new Set(salesData.map(s => s.category))].sort(),
        }
    }, [salesData]);

    const filteredSales = useMemo(() => {
        if (!salesData) return [];
        return salesData.filter(sale => {
            const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(sale.department);
            const sellerMatch = selectedSellers.length === 0 || selectedSellers.includes(sale.seller);
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(sale.category);
            return departmentMatch && sellerMatch && categoryMatch;
        });
    }, [salesData, selectedDepartments, selectedSellers, selectedCategories]);

    const sortedSales = useMemo(() => {
        let sortableItems = [...filteredSales];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredSales, sortConfig]);

    const aggregatedData = useMemo(() => {
        const byDept = filteredSales.reduce((acc, sale) => {
            acc[sale.department] = (acc[sale.department] || 0) + sale.total;
            return acc;
        }, {} as Record<string, number>);

        const bySeller = filteredSales.reduce((acc, sale) => {
            acc[sale.seller] = (acc[sale.seller] || 0) + sale.total;
            return acc;
        }, {} as Record<string, number>);
        
        const byCategory = filteredSales.reduce((acc, sale) => {
            acc[sale.category] = (acc[sale.category] || 0) + sale.total;
            return acc;
        }, {} as Record<string, number>);

        const sortItems = (data: Record<string, number>) => Object.entries(data).map(([name, total]) => ({ name, total })).sort((a,b) => b.total - a.total);

        return {
            departments: sortItems(byDept),
            sellers: sortItems(bySeller),
            categories: sortItems(byCategory),
        }
    }, [filteredSales]);

    const activeFilters = [
        ...selectedDepartments.map(value => ({ type: 'Відділ', value, setter: setSelectedDepartments })),
        ...selectedSellers.map(value => ({ type: 'Продавець', value, setter: setSelectedSellers })),
        ...selectedCategories.map(value => ({ type: 'Категорія', value, setter: setSelectedCategories })),
    ];

    const removeFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => prev.filter(i => i !== value));
    };

    const requestSort = (key: keyof ViewableSale) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const renderCell = (sale: ViewableSale, accessor: keyof ViewableSale) => {
        const value = sale[accessor];
    
        if (accessor === 'total' && typeof value === 'number') {
            return value.toFixed(0);
        }

        if (accessor === 'timestamp') {
            return new Date(value as number).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        }

        if (accessor === 'category' || accessor === 'clientName') {
            return value === 'Unknown' || !value ? '--' : value;
        }
        
        if (accessor === 'status') {
            return sale.status === 'NEEDS_REVIEW' ? '⚠️' : '✓';
        }

        if (typeof value === 'boolean') return value ? "Так" : "Ні";
        
        return value;
    }

    return (
        <div className="space-y-4 p-4">
            <Card className="border-white/10 bg-black/20">
                <CardHeader className="p-4">
                    <CardTitle className="text-xl">Конструктор звітів</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={period} onValueChange={handlePeriodChange}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="Період" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">День</SelectItem>
                                <SelectItem value="week">Тиждень</SelectItem>
                                <SelectItem value="month">Місяць</SelectItem>
                                <SelectItem value="custom">Період...</SelectItem>
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    size="sm"
                                    className={cn("w-[240px] h-9 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>{format(dateRange.from, "dd.MM.yy")} - {format(dateRange.to, "dd.MM.yy")}</>
                                        ) : (
                                            format(dateRange.from, "dd.MM.yy")
                                        )
                                    ) : <span>Оберіть дату</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={(range) => {
                                        setDateRange(range);
                                        setPeriod('custom');
                                    }}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                        
                        <Button size="sm" onClick={handleGenerateReport} disabled={isLoading} className="bg-primary/80 hover:bg-primary">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Завантажити дані"}
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                        <FilterPopover title="Відділи" items={departments} selectedItems={selectedDepartments} onToggle={(item) => setSelectedDepartments(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} onClear={() => setSelectedDepartments([])} />
                        <FilterPopover title="Співробітники" items={sellers} selectedItems={selectedSellers} onToggle={(item) => setSelectedSellers(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} onClear={() => setSelectedSellers([])} />
                        <FilterPopover title="Категорії" items={categories} selectedItems={selectedCategories} onToggle={(item) => setSelectedCategories(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} onClear={() => setSelectedCategories([])} />
                    </div>

                    {activeFilters.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                            {activeFilters.map(filter => (
                                <Badge key={`${filter.type}-${filter.value}`} variant="secondary" className="px-2 py-0.5 text-[10px] font-normal">
                                    <span className="opacity-50 mr-1">{filter.type}:</span>
                                    {filter.value}
                                    <button onClick={() => removeFilter(filter.setter, filter.value)} className="ml-1.5 hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="summary" className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <TabsList className="bg-black/20 border border-white/5">
                        <TabsTrigger value="summary" className="gap-2">
                            <BarChart2 className="h-4 w-4" />
                            Зведення
                        </TabsTrigger>
                        <TabsTrigger value="list" className="gap-2">
                            <List className="h-4 w-4" />
                            Список продажів
                        </TabsTrigger>
                    </TabsList>
                    {!isLoading && salesData && salesData.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            Знайдено {filteredSales.length} записів
                        </span>
                    )}
                </div>

                <TabsContent value="summary" className="mt-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ReportBlock title="Рейтинг Відділів" data={aggregatedData.departments} />
                            <ReportBlock title="Рейтинг Продавців" data={aggregatedData.sellers} />
                            <ReportBlock title="Рейтинг Категорій" data={aggregatedData.categories} />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="list" className="mt-0">
                    <Card className="border-white/5 bg-black/10 overflow-hidden">
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                                </div>
                            ) : salesData && salesData.length > 0 ? (
                                <ScrollArea className="h-[75vh]">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                                            <TableRow>
                                                {(config?.tableColumns || []).map(col => (
                                                    <TableHead key={col.accessor} className={cn(
                                                        'p-0 text-xs h-auto',
                                                        col.accessor === 'id_label' && 'w-[12ch]',
                                                        col.className
                                                    )}>
                                                        <Button variant="ghost" onClick={() => requestSort(col.accessor as keyof ViewableSale)} className="p-2 h-auto w-full justify-start text-xs font-bold uppercase tracking-wider opacity-70">
                                                            {col.header}
                                                            {sortConfig?.key === col.accessor && (
                                                                sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedSales.map((sale, index) => (
                                                <TableRow key={`${sale.id_label}-${index}`} className={cn(
                                                    "transition-colors",
                                                    getRowClass(sale.category)
                                                )}>
                                                    {(config?.tableColumns || []).map(col => (
                                                        <TableCell key={col.accessor} className={cn(
                                                            "py-2 px-2 text-xs",
                                                            col.accessor === 'title' ? 'w-full' : 'whitespace-nowrap',
                                                            col.className
                                                        )}>
                                                            {renderCell(sale, col.accessor as keyof ViewableSale)}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                    <p>Дані за обраний період відсутні.</p>
                                    <p className="text-xs">Натисніть "Завантажити дані" для запиту до API.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}