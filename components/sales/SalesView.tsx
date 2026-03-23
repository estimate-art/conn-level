'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ViewableSale, SalesConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';


const FilterSection = ({ title, items, selectedItems, onToggle }: { title: string, items: string[], selectedItems: string[], onToggle: (item: string) => void }) => (
    <div>
        <h3 className="font-semibold text-sm mb-2">{title}</h3>
        <div className="flex flex-col gap-1">
            {items.map(item => (
                <Button 
                    key={item}
                    variant={selectedItems.includes(item) ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => onToggle(item)}
                    className="w-full justify-start text-left h-auto py-1"
                >
                    {item}
                </Button>
            ))}
        </div>
    </div>
);


const FilterPanel = ({ 
    departments, 
    sellers, 
    categories,
    selectedDepartments,
    selectedSellers,
    selectedCategories,
    onDepartmentToggle,
    onSellerToggle,
    onCategoryToggle,
    onClearFilters
}: {
    departments: string[],
    sellers: string[],
    categories: string[],
    selectedDepartments: string[],
    selectedSellers: string[],
    selectedCategories: string[],
    onDepartmentToggle: (dept: string) => void,
    onSellerToggle: (seller: string) => void,
    onCategoryToggle: (cat: string) => void,
    onClearFilters: () => void,
}) => {
    const hasActiveFilters = selectedDepartments.length > 0 || selectedSellers.length > 0 || selectedCategories.length > 0;
    
    return (
    <Card className="flex flex-col">
        <CardHeader>
            <CardTitle className="text-lg">Фільтри</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                    <FilterSection title="Відділ" items={departments} selectedItems={selectedDepartments} onToggle={onDepartmentToggle} />
                    <FilterSection title="Продавець" items={sellers} selectedItems={selectedSellers} onToggle={onSellerToggle} />
                    <FilterSection title="Категорія" items={categories} selectedItems={selectedCategories} onToggle={onCategoryToggle} />
                </div>
            </ScrollArea>
        </CardContent>
        {hasActiveFilters && (
            <div className="p-4 border-t">
                <Button variant="destructive" onClick={onClearFilters} className="w-full">Скинути фільтри</Button>
            </div>
        )}
    </Card>
)};

export default function SalesView({ sales, isLoading, config, openMappingDialog }: {
    sales: ViewableSale[],
    isLoading: boolean,
    config: SalesConfig | null,
    openMappingDialog: (type: 'categories' | 'sellers' | 'departments') => void
}) {
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    
    const { departments, sellers, categories } = useMemo(() => ({
        departments: [...new Set(sales.map(s => s.department))].sort(),
        sellers: [...new Set(sales.map(s => s.seller.startsWith('User ID:') ? s.department : s.seller))].sort(),
        categories: [...new Set(sales.map(s => s.category))].sort(),
    }), [sales]);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(sale.department);
            const sellerMatch = selectedSellers.length === 0 || selectedSellers.includes(sale.seller.startsWith('User ID:') ? sale.department : sale.seller);
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(sale.category);
            return departmentMatch && sellerMatch && categoryMatch;
        });
    }, [sales, selectedDepartments, selectedSellers, selectedCategories]);

    const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
    };

    const clearAllFilters = () => {
        setSelectedDepartments([]);
        setSelectedSellers([]);
        setSelectedCategories([]);
    };
    
    const renderCell = (sale: ViewableSale, accessor: string) => {
        const value = (sale as any)[accessor];
    
        if (accessor === 'total' && typeof value === 'number') {
            return value.toFixed(0);
        }

        if (accessor === 'seller') {
             return value.toString().startsWith('User ID:') ? sale.department : value;
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
                    <PopoverContent className="w-80 conn-hub-style">
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

    return (
        <div className="grid grid-cols-[1fr_300px] h-full gap-6">
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Продажі за сьогодні</CardTitle>
                            <CardDescription>
                                Знайдено {filteredSales.length} з {sales.length} продажів.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    {(config?.tableColumns || []).map(col => (
                                        <TableHead key={col.accessor} className={cn(
                                            'p-2 text-xs h-auto',
                                            col.accessor !== 'title' && 'whitespace-nowrap',
                                             col.accessor === 'id_label' && 'min-w-[110px]',
                                            col.className
                                        )}>{col.header}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={(config?.tableColumns || []).length} className="text-center text-muted-foreground h-48">
                                            Завантаження даних з RemOnline...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredSales.length > 0 ? (
                                    filteredSales.map((sale, index) => (
                                        <TableRow key={`${sale.id_label}-${index}`} className={cn(sale.status === 'NEEDS_REVIEW' && "bg-yellow-500/10 hover:bg-yellow-500/20")}>
                                            {(config?.tableColumns || []).map(col => (
                                                 <TableCell key={col.accessor} className={cn(
                                                     "py-2 px-2 text-xs",
                                                     col.accessor !== 'title' && 'whitespace-nowrap',
                                                     col.className
                                                 )}>
                                                     {renderCell(sale, col.accessor)}
                                                 </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={(config?.tableColumns || []).length} className="text-center text-muted-foreground h-48">
                                            {sales.length > 0 ? "Нічого не знайдено за вашими фільтрами." : "Продажів за сьогодні не знайдено."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
            <FilterPanel 
                 departments={departments}
                sellers={sellers}
                categories={categories}
                selectedDepartments={selectedDepartments}
                selectedSellers={selectedSellers}
                selectedCategories={selectedCategories}
                onDepartmentToggle={(dept) => handleToggle(setSelectedDepartments, dept)}
                onSellerToggle={(seller) => handleToggle(setSelectedSellers, seller)}
                onCategoryToggle={(cat) => handleToggle(setSelectedCategories, cat)}
                onClearFilters={clearAllFilters}
            />
        </div>
    );
}
