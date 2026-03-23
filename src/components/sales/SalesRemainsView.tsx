'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { searchProducts } from '@/app/actions/remonline-stock';
import { getCategories } from '@/app/actions/remonline-config';
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import type { ProductSearchResult, ProductCategory, ProductStockItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProductDetailsContent = ({ product, title }: { product: ProductSearchResult | null, title: string }) => {
    if (!product) return (
        <>
            <DialogHeader><DialogTitle>Завантаження...</DialogTitle></DialogHeader>
            <div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        </>
    );

    const hasAnyPurchasePrice = product.warehouse_distribution.some(d => d.purchase_price !== null && d.purchase_price !== undefined);

    return (
        <>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    Детальна інформація про залишки на складах.
                    {!hasAnyPurchasePrice && <span className="text-destructive block mt-1">Ціна закупки недоступна. Можливе обмеження прав доступу.</span>}
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Відділ (Склад)</TableHead>
                            <TableHead className="text-right">К-сть</TableHead>
                            <TableHead className="text-right">Закупка</TableHead>
                            <TableHead>IMEI/SN</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {product.warehouse_distribution && product.warehouse_distribution.length > 0 ? (
                            product.warehouse_distribution.map((stockItem, index) => (
                                <TableRow key={index}>
                                    <TableCell>{stockItem.branch_label}</TableCell>
                                    <TableCell className="text-right">{stockItem.quantity}</TableCell>
                                    <TableCell className="text-right">{stockItem.purchase_price ?? 'Н/Д'}</TableCell>
                                    <TableCell>{stockItem.serial_numbers.length > 0 ? stockItem.serial_numbers.join(', ') : '--'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="text-center">Залишків на складах не знайдено.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </>
    );
};


export default function SalesRemainsView() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
    const { toast } = useToast();
    const [debugLog, setDebugLog] = useState<any | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: 'price' | 'quantity', direction: 'asc' | 'desc' | null }>({ key: 'quantity', direction: 'desc' });
    
    const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

    useEffect(() => {
        const fetchInitialCategories = async () => {
            const result = await getCategories();
            if (result.success && result.data) {
                setAllCategories(result.data);
            }
        };
        fetchInitialCategories();
    }, []);

    const handleSearch = async () => {
        if (!query.trim() && selectedCategories.length === 0) {
             toast({ title: 'Введіть запит', description: 'Будь ласка, введіть пошуковий запит або оберіть категорію.' });
            return
        };
        setIsLoading(true);
        setResults([]);
        setDebugLog(null);
        const response = await searchProducts(query, selectedCategories);
        setIsLoading(false);
        if (response.debugLog) {
            setDebugLog(response.debugLog);
        }
        if (response.success && response.data) {
            setResults(response.data || []);
            if (response.data.length === 0) {
                toast({ title: 'Нічого не знайдено', description: 'Спробуйте інший пошуковий запит або фільтри.' });
            }
        } else if (response.error) {
            toast({ variant: 'destructive', title: 'Помилка пошуку', description: response.error });
        }
    };
    
    const handleCategoryToggle = (categoryId: number) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleRowDoubleClick = (product: ProductSearchResult) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };
    
    const handleSortClick = (key: 'price' | 'quantity') => {
        setSortConfig(prev => {
            if (prev.key !== key) return { key, direction: 'desc' };
            if (prev.direction === 'desc') return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { ...prev, direction: null };
            return { key, direction: 'desc' };
        });
    };
    
    const sortedResults = useMemo(() => {
        if (!sortConfig.direction) return results;
        return [...results].sort((a, b) => {
            let valA = 0;
            let valB = 0;
            if (sortConfig.key === 'price') {
                valA = a.prices?.['177803'] ?? 0;
                valB = b.prices?.['177803'] ?? 0;
            } else { // quantity
                valA = a.total_quantity;
                valB = b.total_quantity;
            }
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });
    }, [results, sortConfig]);

    const SortableHeader = ({ title, sortKey }: { title: string, sortKey: 'price' | 'quantity' }) => (
        <Button variant="ghost" size="sm" onClick={() => handleSortClick(sortKey)} className="p-2 h-auto w-full justify-end">
            {title}
            {sortConfig.key === sortKey && sortConfig.direction === 'asc' && <ArrowUp className="ml-1 h-3 w-3" />}
            {sortConfig.key === sortKey && sortConfig.direction === 'desc' && <ArrowDown className="ml-1 h-3 w-3" />}
        </Button>
    );

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Пошук по залишках</CardTitle>
                    <CardDescription>Введіть назву, артикул або оберіть категорію для пошуку.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Input
                            placeholder="Пошук..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-grow"
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Пошук
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Категорії</h3>
                        <div className="flex flex-wrap gap-2">
                            {allCategories.map((category) => (
                                <Button
                                    key={category.id}
                                    variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleCategoryToggle(category.id)}
                                >
                                    {category.title}
                                </Button>
                            ))}
                        </div>
                    </div>


                    <ScrollArea className="h-[60vh] border rounded-md">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead className="p-1 text-[11px]">Категорія</TableHead>
                                    <TableHead className="p-1 text-[11px] w-[40%]">Назва</TableHead>
                                    <TableHead className="text-right p-0 text-[11px]"><SortableHeader title="Ціна" sortKey="price" /></TableHead>
                                    <TableHead className="text-right p-1 text-[11px]">Закупка</TableHead>
                                    <TableHead className="text-right p-0 text-[11px]"><SortableHeader title="Залишок" sortKey="quantity" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-48"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                ) : sortedResults.length > 0 ? (
                                    sortedResults.map(product => (
                                        <TableRow key={product.id} onDoubleClick={() => handleRowDoubleClick(product)} className="cursor-pointer">
                                            <TableCell className="p-1 text-[11px] leading-tight">{product.category}</TableCell>
                                            <TableCell className="p-1 text-[11px] leading-tight font-medium">{product.title}</TableCell>
                                            <TableCell className="text-right p-1 text-[11px] leading-tight font-mono">{product.prices?.['177803'] ? product.prices['177803'].toFixed(0) : 'Н/Д'}</TableCell>
                                            <TableCell className="text-right p-1 text-[11px] leading-tight font-mono text-muted-foreground">{product.latest_purchase_price ? product.latest_purchase_price.toFixed(0) : 'Н/Д'}</TableCell>
                                            <TableCell className={cn("text-right p-1 text-[11px] leading-tight font-mono", product.total_quantity > 0 && "font-bold text-sm")}>{product.total_quantity}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Результати пошуку з'являться тут.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl">
                     <ProductDetailsContent product={selectedProduct} title={selectedProduct?.title || ''} />
                </DialogContent>
            </Dialog>

            {debugLog && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Вікно відлагодження</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="step1" className="w-full">
                            <TabsList>
                                <TabsTrigger value="step1">1. Discovery</TabsTrigger>
                                <TabsTrigger value="step2">2. Infrastructure</TabsTrigger>
                                <TabsTrigger value="step3">3. Stock Retrieval</TabsTrigger>
                                <TabsTrigger value="step4">4. Aggregation</TabsTrigger>
                                {debugLog.error && <TabsTrigger value="error" className="text-destructive">Error</TabsTrigger>}
                            </TabsList>
                            <TabsContent value="step1">
                                <ScrollArea className="h-60 rounded-md border mt-2 bg-muted/50">
                                    <pre className="p-4 text-xs whitespace-pre-wrap break-all">{JSON.stringify(debugLog.step1_discovery, null, 2)}</pre>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="step2">
                                <ScrollArea className="h-60 rounded-md border mt-2 bg-muted/50">
                                    <pre className="p-4 text-xs whitespace-pre-wrap break-all">{JSON.stringify(debugLog.step2_infrastructure, null, 2)}</pre>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="step3">
                                 <ScrollArea className="h-60 rounded-md border mt-2 bg-muted/50">
                                    <pre className="p-4 text-xs whitespace-pre-wrap break-all">{JSON.stringify(debugLog.step3_stockRetrieval, null, 2)}</pre>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="step4">
                                <ScrollArea className="h-60 rounded-md border mt-2 bg-muted/50">
                                    <pre className="p-4 text-xs whitespace-pre-wrap break-all">{JSON.stringify(debugLog.step4_aggregation, null, 2)}</pre>
                                </ScrollArea>
                            </TabsContent>
                             {debugLog.error && (
                                <TabsContent value="error">
                                    <ScrollArea className="h-60 rounded-md border mt-2 bg-destructive/10">
                                        <pre className="p-4 text-xs text-destructive whitespace-pre-wrap break-all">{JSON.stringify(debugLog.error, null, 2)}</pre>
                                    </ScrollArea>
                                </TabsContent>
                            )}
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
