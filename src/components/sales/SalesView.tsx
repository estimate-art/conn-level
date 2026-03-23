'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ViewableSale, SalesConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const FilterPopover = ({ title, items, selectedItems, onToggle, onClear }: {
    title: string;
    items: { name: string, total: number }[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    onClear: () => void;
}) => {
    const hasSelection = selectedItems.length > 0;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between h-10">
                    <span>{title}{hasSelection ? ` (${selectedItems.length})` : ''}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
                <div className="p-2 border-b">
                    <h4 className="font-medium text-sm">{title}</h4>
                </div>
                <ScrollArea className="max-h-64">
                    <div className="p-2 space-y-1">
                        {items.map(item => (
                            <div key={item.name} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${title}-${item.name}`}
                                    checked={selectedItems.includes(item.name)}
                                    onCheckedChange={() => onToggle(item.name)}
                                />
                                <Label htmlFor={`${title}-${item.name}`} className="font-normal text-sm w-full cursor-pointer flex justify-between items-center">
                                    <span>{item.name}</span>
                                    {item.total > 0 && <span className="text-xs text-muted-foreground font-mono tabular-nums">{item.total.toLocaleString('uk-UA')}</span>}
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                {hasSelection && (
                     <div className="p-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={onClear}>
                            <X className="mr-2 h-4 w-4"/>
                            Очистити
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
};

const getCategoryGroup = (category: string): string => {
    const groupMap: Record<string, string[]> = {
        'Авто/МЗП/Звук': ['Авто', 'Мзп', 'Аудіо'],
        'Скло/ДУ/Чохли': ['Скло', 'ДУ', 'Чохол'],
        'Техніка': ['Смартфони', 'Павербанк', 'Ноутбук', 'DEMO'],
        'Інше': ['--', 'SIM', 'Інше', 'Unknown']
    };

    for (const groupName in groupMap) {
        if (groupMap[groupName].includes(category)) {
            return groupName;
        }
    }
    return 'Інше';
};

const BillDetailsDialog = ({ bill, onOpenChange }: { bill: { items: ViewableSale[], total: number } | null, onOpenChange: (open: boolean) => void }) => {
    if (!bill) return null;

    return (
        <Dialog open={!!bill} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Чек: {bill.items[0]?.id_label}</DialogTitle>
                    <DialogDescription>
                        Перелік усіх товарів у чеку.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-96">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Назва</TableHead>
                                <TableHead className="text-right">Сума</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bill.items.map((item, index) => (
                                <TableRow key={`${item.title}-${index}`}>
                                    <TableCell>{item.title}</TableCell>
                                    <TableCell className="text-right font-mono">{item.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <DialogFooter className="pr-4">
                    <div className="text-lg font-bold">Загальна сума: <span className="font-mono">{bill.total.toFixed(2)} грн</span></div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function SalesView({ sales, isLoading, config, showAttentionColumn, selectedDate, onDateChange, period, onPeriodChange }: {
    sales: ViewableSale[],
    isLoading: boolean,
    config: SalesConfig | null,
    showAttentionColumn: boolean,
    selectedDate: Date;
    onDateChange: (date: Date | undefined) => void;
    period: 'day' | 'week' | 'month';
    onPeriodChange: (period: 'day' | 'week' | 'month') => void;
}) {
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ViewableSale; direction: 'asc' | 'desc' } | null>({ key: 'timestamp', direction: 'desc' });
    const [selectedBill, setSelectedBill] = useState<{ items: ViewableSale[], total: number } | null>(null);

    const tableColumns = useMemo(() => {
        if (!config?.tableColumns) return [];
        if (showAttentionColumn) {
            return config.tableColumns;
        }
        return config.tableColumns.filter(col => col.accessor !== 'status');
    }, [config, showAttentionColumn]);
    
    const { departments, sellers, groups, categories } = useMemo(() => {
        const allSaleCategories = [...new Set(sales.map(s => s.category))].sort();
        const saleGroups = [...new Set(allSaleCategories.map(getCategoryGroup))].sort();

        const availableCategories = selectedGroups.length > 0
            ? allSaleCategories.filter(cat => selectedGroups.includes(getCategoryGroup(cat)))
            : allSaleCategories;

        return {
            departments: [...new Set(sales.map(s => s.department))].sort(),
            sellers: [...new Set(sales.map(s => s.seller))].sort(),
            groups: saleGroups,
            categories: availableCategories,
        }
    }, [sales, selectedGroups]);

    useEffect(() => {
        setSelectedCategories(prev => prev.filter(cat => categories.includes(cat)));
    }, [categories]);

    const filterData = useMemo(() => {
        const calculateTotals = (
            itemsToTotal: string[],
            groupByField: keyof ViewableSale,
            filterFn: (sale: ViewableSale) => boolean
        ) => {
            const totals = new Map<string, number>();
            sales.filter(filterFn).forEach(sale => {
                const key = sale[groupByField] as string;
                if(key) {
                    totals.set(key, (totals.get(key) || 0) + sale.total);
                }
            });
            return itemsToTotal.map(item => ({
                name: item,
                total: totals.get(item) || 0,
            })).sort((a,b) => b.total - a.total);
        };

        const departmentTotals = calculateTotals(departments, 'department', sale =>
            (selectedSellers.length === 0 || selectedSellers.includes(sale.seller)) &&
            (selectedGroups.length === 0 || selectedGroups.includes(getCategoryGroup(sale.category))) &&
            (selectedCategories.length === 0 || selectedCategories.includes(sale.category))
        );

        const sellerTotals = calculateTotals(sellers, 'seller', sale =>
            (selectedDepartments.length === 0 || selectedDepartments.includes(sale.department)) &&
            (selectedGroups.length === 0 || selectedGroups.includes(getCategoryGroup(sale.category))) &&
            (selectedCategories.length === 0 || selectedCategories.includes(sale.category))
        );

        const categoryTotals = calculateTotals(categories, 'category', sale =>
            (selectedDepartments.length === 0 || selectedDepartments.includes(sale.department)) &&
            (selectedSellers.length === 0 || selectedSellers.includes(sale.seller)) &&
            (selectedGroups.length === 0 || selectedGroups.includes(getCategoryGroup(sale.category)))
        );
        
        const groupTotalsMap = new Map<string, number>();
        sales.filter(sale =>
            (selectedDepartments.length === 0 || selectedDepartments.includes(sale.department)) &&
            (selectedSellers.length === 0 || selectedSellers.includes(sale.seller)) &&
            (selectedCategories.length === 0 || selectedCategories.includes(sale.category))
        ).forEach(sale => {
            const group = getCategoryGroup(sale.category);
            groupTotalsMap.set(group, (groupTotalsMap.get(group) || 0) + sale.total);
        });
        const groupTotals = groups.map(g => ({
            name: g,
            total: groupTotalsMap.get(g) || 0
        })).sort((a,b) => b.total - a.total);

        return { departmentTotals, sellerTotals, groupTotals, categoryTotals };

    }, [sales, departments, sellers, groups, categories, selectedDepartments, selectedSellers, selectedGroups, selectedCategories]);


    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(sale.department);
            const sellerMatch = selectedSellers.length === 0 || selectedSellers.includes(sale.seller);
            const saleGroup = getCategoryGroup(sale.category);
            const groupMatch = selectedGroups.length === 0 || selectedGroups.includes(saleGroup);
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(sale.category);
            return departmentMatch && sellerMatch && groupMatch && categoryMatch;
        });
    }, [sales, selectedDepartments, selectedSellers, selectedGroups, selectedCategories]);
    
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


    const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
    };
    
    const requestSort = (key: keyof ViewableSale) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleRowClick = (sale: ViewableSale) => {
        const billItems = sales.filter(s => s.id_label === sale.id_label);
        if (billItems.length > 0) {
            const billTotal = billItems.reduce((sum, item) => sum + item.total, 0);
            setSelectedBill({ items: billItems, total: billTotal });
        }
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
    
    const activeFilters = useMemo(() => ([
        ...selectedDepartments.map(value => ({ type: 'department', value, setter: setSelectedDepartments })),
        ...selectedSellers.map(value => ({ type: 'seller', value, setter: setSelectedSellers })),
        ...selectedGroups.map(value => ({ type: 'group', value, setter: setSelectedGroups })),
        ...selectedCategories.map(value => ({ type: 'category', value, setter: setSelectedCategories })),
    ]), [selectedDepartments, selectedSellers, selectedGroups, selectedCategories]);

    const removeFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => prev.filter(i => i !== value));
    };

    const clearAllFilters = () => {
        setSelectedDepartments([]);
        setSelectedSellers([]);
        setSelectedGroups([]);
        setSelectedCategories([]);
    };
    
    const renderCell = (sale: ViewableSale, accessor: keyof ViewableSale) => {
        const value = sale[accessor];
    
        if (accessor === 'total' && typeof value === 'number') {
            return value.toFixed(0);
        }

        if (accessor === 'timestamp') {
            const date = new Date(value as number);
            if (period === 'day') {
                return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        }

        if (accessor === 'category' || accessor === 'clientName') {
            return value === 'Unknown' || !value ? '--' : value;
        }
        
        if (accessor === 'status') {
            return sale.status === 'NEEDS_REVIEW' ? (
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 cursor-pointer text-xs font-semibold">
                           ⚠️ Потребує уваги
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-background/95 backdrop-blur-sm border-border/50">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Причини для перевірки</h4>
                                <p className="text-sm text-muted-foreground">
                                    Система не впевнена в наступних даних:
                                </p>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {sale.reviewReasons.map((reason, i) => <li key={i}>{reason}</li>)}
                            </ul>
                        </div>
                    </PopoverContent>
                </Popover>
            ) : '✓';
        }

        if (typeof value === 'boolean') return value ? "Так" : "Ні";
        
        return value;
    }

    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const formattedDateValue = `${y}-${m}-${d}`;

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const dateParts = e.target.value.split('-').map(Number);
            if(dateParts.length === 3) {
                const [year, month, day] = dateParts;
                const newDate = new Date(year, month - 1, day);
                onDateChange(newDate);
            }
        } else {
            onDateChange(undefined);
        }
    };

    const hasActiveFilters = activeFilters.length > 0;

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <BillDetailsDialog bill={selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)} />
            
            <Card className="flex flex-col flex-shrink-0">
                <CardHeader className="p-4">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                         <div className="flex items-center gap-2">
                            <CardTitle className="whitespace-nowrap">Продажі за</CardTitle>
                            <Select value={period} onValueChange={(v) => onPeriodChange(v as any)}>
                                <SelectTrigger className="w-[110px] h-10">
                                    <SelectValue placeholder="Період" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">День</SelectItem>
                                    <SelectItem value="week">Тиждень</SelectItem>
                                    <SelectItem value="month">Місяць</SelectItem>
                                </SelectContent>
                            </Select>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formattedDateValue}
                                onChange={handleDateInputChange}
                                className="h-10 w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <FilterPopover title="Відділ" items={filterData.departmentTotals} selectedItems={selectedDepartments} onToggle={(item) => handleToggle(setSelectedDepartments, item)} onClear={() => setSelectedDepartments([])} />
                            <FilterPopover title="Продавець" items={filterData.sellerTotals} selectedItems={selectedSellers} onToggle={(item) => handleToggle(setSelectedSellers, item)} onClear={() => setSelectedSellers([])} />
                            <FilterPopover title="Група" items={filterData.groupTotals} selectedItems={selectedGroups} onToggle={(item) => handleToggle(setSelectedGroups, item)} onClear={() => setSelectedGroups([])} />
                            <FilterPopover title="Категорія" items={filterData.categoryTotals} selectedItems={selectedCategories} onToggle={(item) => handleToggle(setSelectedCategories, item)} onClear={() => setSelectedCategories([])} />
                            {hasActiveFilters && (
                                <Button variant="destructive" size="sm" onClick={clearAllFilters}>Скинути все</Button>
                            )}
                        </div>
                    </div>
                     {hasActiveFilters && (
                        <div className="p-2 bg-muted/50 rounded-md mt-4">
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-sm font-semibold mr-2">Активні фільтри:</span>
                                {activeFilters.map(filter => (
                                    <Badge key={`${filter.type}-${filter.value}`} variant="secondary" className="pl-2">
                                        {filter.value}
                                        <button onClick={() => removeFilter(filter.setter, filter.value)} className="ml-1 rounded-full p-0.5 hover:bg-background/50">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    <CardDescription className="mt-2 pt-4 border-t">
                        Знайдено {filteredSales.length} з {sales.length} продажів.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card className="flex flex-col flex-1 overflow-hidden">
                <CardContent className="p-0 flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <Table>
                             <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                                <TableRow>
                                    {tableColumns.map(col => (
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
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={tableColumns.length} className="text-center text-muted-foreground h-48">
                                            Завантаження даних з RemOnline...
                                        </TableCell>
                                    </TableRow>
                                ) : sortedSales.length > 0 ? (
                                    sortedSales.map((sale, index) => (
                                        <TableRow key={`${sale.id_label}-${index}`} onClick={() => handleRowClick(sale)} className={cn(
                                            "cursor-pointer transition-colors",
                                            showAttentionColumn && sale.status === 'NEEDS_REVIEW' 
                                                ? "bg-yellow-500/10 hover:bg-yellow-500/20" 
                                                : getRowClass(sale.category)
                                        )}>
                                            {tableColumns.map(col => (
                                                 <TableCell key={col.accessor} className={cn(
                                                     "py-2 px-2 text-xs",
                                                     col.accessor === 'title' ? 'w-full' : 'whitespace-nowrap',
                                                     col.className
                                                 )}>
                                                     {renderCell(sale, col.accessor as keyof ViewableSale)}
                                                 </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={tableColumns.length} className="text-center text-muted-foreground h-48">
                                            {sales.length > 0 ? "Нічого не знайдено за вашими фільтрами." : "Продажів за обраний період не знайдено."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}