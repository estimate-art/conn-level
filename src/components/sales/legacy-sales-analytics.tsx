
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { getSales } from '@/app/actions/remonline-sales';
import { updateSalesConfig } from '@/app/actions/remonline-config';
import type { ViewableSale, SalesConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import MappingDialog from './MappingDialog';
import { BarChart3, Package, FileText, Settings, ArrowLeft, ChevronDown } from 'lucide-react';
import SalesRemainsView from './SalesRemainsView';
import SalesReportsView from './SalesReportsView';
import SalesSettingsView from './SalesSettingsView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';


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

const FilterSection = ({ title, items, selectedItems, onToggle }: {
    title: string;
    items: { name: string; total: number; }[];
    selectedItems: string[];
    onToggle: (item: string) => void;
}) => (
     <div className="py-2">
        <div className="space-y-1">
            {items.map(item => (
                <div key={item.name} className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted/50">
                    <Checkbox id={`${title}-${item.name}`} checked={selectedItems.includes(item.name)} onCheckedChange={() => onToggle(item.name)} />
                    <Label htmlFor={`${title}-${item.name}`} className="flex justify-between w-full cursor-pointer text-sm font-normal">
                        <span>{item.name}</span>
                        {item.total > 0 && <span className="text-xs font-mono text-muted-foreground">{item.total.toLocaleString('uk-UA')}</span>}
                    </Label>
                </div>
            ))}
        </div>
    </div>
);

const SalesViewMobile = ({ onBack, isFilterOpen, onFilterOpenChange }: { 
    onBack: () => void,
    isFilterOpen: boolean,
    onFilterOpenChange: (open: boolean) => void
}) => {
    const [sales, setSales] = useState<ViewableSale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    
    const [config, setConfig] = useState<SalesConfig | null>(null);
    const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
    const [currentMappingType, setCurrentMappingType] = useState<'categories' | 'sellers' | 'departments'>('categories');
    
    const [openAccordion, setOpenAccordion] = useState<string | null>('departments');

    const toggleAccordion = (filter: string) => {
        setOpenAccordion(prev => prev === filter ? filter : filter);
    };


    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            const salesResult = await getSales('day');
            if (salesResult.success && salesResult.data) {
                setSales(salesResult.data);
            } else {
                console.error("Failed to fetch sales:", salesResult.error);
                toast({
                    variant: "destructive",
                    title: "Помилка завантаження",
                    description: "Не вдалося отримати дані з RemOnline.",
                });
            }

            const configResponse = await fetch('/api/sales-config');
            if (configResponse.ok) {
                setConfig(await configResponse.json());
            } else {
                toast({ variant: 'destructive', title: 'Помилка завантаження конфігурації' });
            }
            setIsLoading(false);
        };

        fetchInitialData();
    }, [toast]);
    
    const unmappedItems = useMemo(() => {
        if (!config || !sales || sales.length === 0) {
            return { categories: [], sellers: [], departments: [] };
        }
        const salesToReview = sales.filter(s => s.status === 'NEEDS_REVIEW');
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
    }, [sales, config]);

    const handleConfigChange = async (newConfig: SalesConfig) => {
        setConfig(newConfig);
        const result = await updateSalesConfig(newConfig);
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

    const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
        setter(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
    };
    
    const hasActiveFilters = selectedDepartments.length > 0 || selectedSellers.length > 0 || selectedGroups.length > 0 || selectedCategories.length > 0;

    const clearAllFilters = () => {
        setSelectedDepartments([]);
        setSelectedSellers([]);
        setSelectedGroups([]);
        setSelectedCategories([]);
    };
    
    const renderCell = (sale: ViewableSale, accessor: keyof ViewableSale) => {
        const value = sale[accessor];
    
        if (accessor === 'status') {
            return sale.status === 'NEEDS_REVIEW' ? (
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 cursor-pointer text-xs">
                           ⚠️
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 conn-hub-style">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Причини для перевірки</h4>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {sale.reviewReasons.map((reason, i) => <li key={i}>{reason}</li>)}
                            </ul>
                        </div>
                    </PopoverContent>
                </Popover>
            ) : null;
        }
        
        return value;
    }

    const getCardClass = (sale: ViewableSale) => {
        if (sale.status === 'NEEDS_REVIEW') {
            return "border-l-yellow-400";
        }
        switch (sale.category) {
            case 'Скло': return 'border-l-blue-400';
            case 'ДУ': return 'border-l-purple-400';
            case 'Чохол': return 'border-l-green-400';
            case 'DEMO': return 'border-l-orange-400';
            default: return 'border-l-transparent';
        }
    };
    
    const FilterPanel = (
        <Sheet open={isFilterOpen} onOpenChange={onFilterOpenChange}>
            <SheetContent side="bottom" className="h-[80vh] flex flex-col rounded-t-2xl">
                <SheetHeader>
                    <SheetTitle>Фільтри</SheetTitle>
                </SheetHeader>

                <div className="border-b border-border">
                    <ScrollArea orientation="horizontal" className="whitespace-nowrap">
                         <div className="flex w-max space-x-2 p-2">
                            {(['departments', 'sellers', 'groups', 'categories'] as const).map(filterName => {
                                const labels: Record<string, string> = { departments: 'Відділи', sellers: 'Продавці', groups: 'Групи', categories: 'Категорії' };
                                const counts: Record<string, number> = { 
                                    departments: selectedDepartments.length, 
                                    sellers: selectedSellers.length, 
                                    groups: selectedGroups.length, 
                                    categories: selectedCategories.length 
                                };
                                const label = labels[filterName];
                                const count = counts[filterName];

                                return (
                                    <Button
                                        key={filterName}
                                        variant={openAccordion === filterName ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleAccordion(filterName)}
                                    >
                                        {label} {count > 0 && `(${count})`}
                                    </Button>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>

                <ScrollArea className="flex-grow">
                    <div className="px-4">
                        {openAccordion === 'departments' && <FilterSection title="Відділи" items={filterData.departmentTotals} selectedItems={selectedDepartments} onToggle={item => handleToggle(setSelectedDepartments, item)} />}
                        {openAccordion === 'sellers' && <FilterSection title="Продавці" items={filterData.sellerTotals} selectedItems={selectedSellers} onToggle={item => handleToggle(setSelectedSellers, item)} />}
                        {openAccordion === 'groups' && <FilterSection title="Групи" items={filterData.groupTotals} selectedItems={selectedGroups} onToggle={item => handleToggle(setSelectedGroups, item)} />}
                        {openAccordion === 'categories' && <FilterSection title="Категорії" items={filterData.categoryTotals} selectedItems={selectedCategories} onToggle={item => handleToggle(setSelectedCategories, item)} />}
                    </div>
                </ScrollArea>
                
                <SheetFooter className="flex-row gap-2 pt-4 border-t bg-background -mx-6 px-6 pb-6">
                    {hasActiveFilters && <Button variant="destructive" size="sm" onClick={clearAllFilters} className="flex-1">Скинути</Button>}
                    <Button onClick={() => onFilterOpenChange(false)} className="flex-1">Готово</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );

    return (
        <div className="flex flex-col h-full">
            {config && (
              <MappingDialog 
                  open={isMappingDialogOpen}
                  onOpenChange={setIsMappingDialogOpen}
                  type={currentMappingType}
                  config={config}
                  onConfigChange={handleConfigChange}
                  unmappedItems={unmappedItems}
              />
            )}
            
            {config && FilterPanel}

            <div className="flex justify-between items-center px-1 py-1 flex-shrink-0 border-b">
                <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Меню</Button>
                <span className="text-sm text-muted-foreground">{filteredSales.length} з {sales.length}</span>
                {(unmappedItems.categories.length + unmappedItems.sellers.length + unmappedItems.departments.length) > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => openMappingDialog('categories')}>
                        Увага ({unmappedItems.categories.length + unmappedItems.sellers.length + unmappedItems.departments.length})
                    </Button>
                )}
            </div>
            
            <ScrollArea className="flex-grow">
                 <div className="space-y-2 p-1">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground pt-20">Завантаження...</div>
                    ) : filteredSales.length > 0 ? (
                        filteredSales.map((sale, index) => (
                            <Card key={`${sale.id_label}-${index}`} className={cn(
                                "conn-hub-style !p-3 !rounded-xl transition-all relative border-l-4",
                                getCardClass(sale)
                            )}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow pr-4">
                                        <p className="font-bold text-sm leading-tight">{sale.title}</p>
                                        <div className="flex items-center gap-1.5 text-white/70 font-medium mt-1 text-xs">
                                            <span>{sale.seller}</span>
                                            <span className="opacity-50">/</span>
                                            <span>{sale.department}</span>
                                        </div>
                                    </div>
                            
                                    <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
                                        <p className="font-bold text-lg font-mono leading-tight">{sale.total.toFixed(0)}</p>
                                        <div className="flex items-center gap-1.5 text-white/70 font-medium text-xs">
                                            <span>{sale.category}</span>
                                            <span className="opacity-50">/</span>
                                            <span>{new Date(sale.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-1 right-2">
                                    {renderCell(sale, 'status')}
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground pt-20">
                            {sales.length > 0 ? "Нічого не знайдено за вашими фільтрами." : "Продажів за сьогодні не знайдено."}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

export default function LegacySalesAnalytics({ onBack, isFilterOpen, onFilterOpenChange }: { 
    onBack: () => void,
    isFilterOpen?: boolean,
    onFilterOpenChange?: (open: boolean) => void,
}) {
    const [mobileView, setMobileView] = useState<'menu' | 'sales' | 'remains' | 'reports' | 'settings'>('menu');
    
    const menuItems = [
        { view: 'sales', label: 'Продажі', icon: BarChart3 },
        { view: 'remains', label: 'Залишки', icon: Package },
        { view: 'reports', label: 'Звіти', icon: FileText },
        { view: 'settings', label: 'Налаштування', icon: Settings },
    ];

    if (mobileView === 'menu') {
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
                        onClick={() => setMobileView(item.view as 'sales' | 'remains' | 'reports' | 'settings')}
                        className="conn-hub-style h-32 !p-4 !rounded-3xl flex flex-col items-center justify-center text-center"
                    >
                        <item.icon className="w-10 h-10 mb-2" />
                        <span className="text-base font-bold">{item.label}</span>
                    </button>
                    ))}
                </div>
            </div>
        );
    }
    
    const renderMobileView = () => {
        switch(mobileView) {
            case 'sales':
                return <SalesViewMobile 
                    onBack={() => setMobileView('menu')}
                    isFilterOpen={isFilterOpen ?? false}
                    onFilterOpenChange={onFilterOpenChange ?? (() => {})}
                />;
            case 'remains':
                return (
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => setMobileView('menu')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Меню</Button>
                        <SalesRemainsView />
                    </div>
                );
            case 'reports':
                 return (
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => setMobileView('menu')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Меню</Button>
                        <SalesReportsView />
                    </div>
                );
            case 'settings':
                 return (
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => setMobileView('menu')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Меню</Button>
                        <SalesSettingsView />
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="h-full">
             {renderMobileView()}
        </div>
    );
}
