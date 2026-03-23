'use server';

import { chunkArray } from '@/lib/utils';
import type { CategoryRule, ProductSearchResult } from '@/lib/types';
import { 
    BASE_URL, 
    CHUNK_SIZE,
    getSalesConfig,
    handleApiError, 
    formatApiError,
    getInfrastructure,
    getWarehouseBranchMap,
    getApiKey,
    getValidToken
} from './remonline-shared';
import Fuse from 'fuse.js';

// --- Phase 3: Optimized Stock Retrieval ---

async function fetchAggregatedStock(productIds: number[], warehouseIds: number[], debugLog?: any): Promise<Map<number, { total_quantity: number, latest_purchase_price: number | null, warehouse_distribution: any[] }>> {
    let token: string;
    try {
        token = await getValidToken();
    } catch (e) {
        return new Map();
    }

    if (productIds.length === 0 || warehouseIds.length === 0) {
        return new Map();
    }

    const productChunks = chunkArray(productIds, CHUNK_SIZE);
    const stockPromises: Promise<any>[] = [];
    const urls: string[] = [];

    for (const warehouseId of warehouseIds) {
        for (const chunk of productChunks) {
            const url = new URL(`${BASE_URL}/warehouse/goods/${warehouseId}`);
            url.searchParams.set('token', token);
            url.searchParams.set('exclude_zero_residue', 'false');
            chunk.forEach(id => url.searchParams.append('ids[]', id.toString()));
            
            const urlString = url.toString();
            urls.push(urlString);
            stockPromises.push(fetch(urlString, { cache: 'no-store' }).then(res => res.json()));
        }
    }
    
    if (debugLog) {
        debugLog.requests = urls;
    }

    const allStockResponses = await Promise.all(stockPromises);
    
    if (debugLog) {
        debugLog.responses = allStockResponses;
    }

    const aggregatedStock = new Map<number, { total_quantity: number, latest_purchase_price: number | null, warehouse_distribution: any[] }>();

    for (const response of allStockResponses) {
        if (!response.data || !Array.isArray(response.data)) continue;
        
        const validatedItems = response.data.filter((item: any) => item.product_id && productIds.includes(Number(item.product_id)));

        for (const item of validatedItems) {
            const pId = item.product_id;
            if (!pId) continue;

            const numericPId = Number(pId);

            if (!aggregatedStock.has(numericPId)) {
                aggregatedStock.set(numericPId, {
                    total_quantity: 0,
                    latest_purchase_price: null,
                    warehouse_distribution: [],
                });
            }
            const entry = aggregatedStock.get(numericPId)!;
            entry.total_quantity += item.residue || 0;
            if (item.price_purchase !== null && item.price_purchase !== undefined) {
                 entry.latest_purchase_price = item.price_purchase;
            }
            entry.warehouse_distribution.push({
                warehouse_id: item.warehouse_id,
                quantity: item.residue || 0,
                purchase_price: item.price_purchase ?? null,
                serial_numbers: item.serial_numbers || [],
            });
        }
    }
    
    return aggregatedStock;
}

// --- Phase 2 & 4: Search & Discovery + Merging ---

function classifySearchedProduct(product: { title: string }, rules: CategoryRule[]): string {
    const cleanTitle = (product.title || '').toLowerCase().trim();
    if (!cleanTitle || !rules) return '--';

    const exactMatches = rules.filter(rule => 
        rule.tags.some(tag => cleanTitle.includes(tag.toLowerCase()))
    );

    if (exactMatches.length > 0) {
        exactMatches.sort((a, b) => b.priority - a.priority);
        return exactMatches[0].label;
    }

    const fuse = new Fuse(rules, {
        keys: ['tags'],
        threshold: 0.4,
        includeScore: true,
        shouldSort: true,
    });

    const fuzzyResults = fuse.search(cleanTitle);

    if (fuzzyResults.length === 0) {
        return '--';
    }

    fuzzyResults.sort((a, b) => {
        if (a.item.priority !== b.item.priority) {
            return b.item.priority - a.item.priority;
        }
        return (a.score ?? 1) - (b.score ?? 1);
    });
    
    const bestMatch = fuzzyResults[0];
    const confidence = 1 - (bestMatch.score || 1);
    
    if (confidence < 0.6) {
        return '--';
    }

    return bestMatch.item.label;
}


export async function searchProducts(query: string, categoryIds: number[]): Promise<{ success: boolean, data?: ProductSearchResult[], error?: string, debugLog?: any }> {
    let token: string;
    try {
        token = await getValidToken();
    } catch (e: any) {
        return { success: false, error: e.message };
    }
    
    const debugLog: any = {
        step1_discovery: {},
        step2_infrastructure: {},
        step3_stockRetrieval: { requests: [], responses: [] },
        step4_aggregation: {}
    };
    
    try {
        // 1. Initial Discovery
        const productsUrl = new URL(`${BASE_URL}/products/`);
        productsUrl.searchParams.set('token', token);
        productsUrl.searchParams.set('q', query);
        categoryIds.forEach(id => productsUrl.searchParams.append('category_ids[]', id.toString()));
        
        debugLog.step1_discovery.url = productsUrl.toString();

        const productsRes = await fetch(productsUrl.toString(), { cache: 'no-store' });
        if (!productsRes.ok) {
            const error = await handleApiError(productsRes);
            debugLog.step1_discovery.error = error;
            return { success: false, error: formatApiError(error), debugLog };
        }
        const productsData = await productsRes.json();
        debugLog.step1_discovery.response = productsData;
        if (!productsData.data?.length) {
            return { success: true, data: [], debugLog };
        }
        
        const targetProductIds = [...new Set(productsData.data.map((p: any) => Number(p.id)))];
        debugLog.step1_discovery.unique_ids = targetProductIds;

        // 2. Get Infrastructure
        const { branches, warehouses } = await getInfrastructure();
        const warehouseIds = warehouses.map(w => w.id);
        const warehouseMap = await getWarehouseBranchMap();
        debugLog.step2_infrastructure = { branches, warehouses, warehouseMap: Array.from(warehouseMap.entries()) };
        
        // 3. Fetch Aggregated Stock
        const stockData = await fetchAggregatedStock(targetProductIds, warehouseIds, debugLog.step3_stockRetrieval);

        // 4. Merge Data
        debugLog.step4_aggregation.rawStockMap = Array.from(stockData.entries());

        const config = await getSalesConfig();
        
        const uniqueProducts = Array.from(new Map(productsData.data.map((p: any) => [Number(p.id), p])).values());
        debugLog.step4_aggregation.unique_products_from_discovery = uniqueProducts;

        const finalResults: ProductSearchResult[] = uniqueProducts
            .map((p: any) => {
                const stockInfo = stockData.get(Number(p.id));
                
                const warehouse_distribution_with_labels = (stockInfo?.warehouse_distribution || []).map(dist => ({
                    ...dist,
                    branch_label: warehouseMap.get(dist.warehouse_id) || 'Unknown'
                }));
                
                return {
                    id: p.id,
                    title: p.title,
                    article: p.article,
                    prices: p.prices || {},
                    category: classifySearchedProduct(p, config.rules),
                    total_quantity: stockInfo?.total_quantity || 0,
                    latest_purchase_price: stockInfo?.latest_purchase_price || null,
                    warehouse_distribution: warehouse_distribution_with_labels,
                };
            });

        debugLog.step4_aggregation.finalResults = finalResults;
        return { success: true, data: finalResults, debugLog };
    } catch (error: any) {
        console.error('searchProducts failed:', error);
        debugLog.error = error.message;
        return { success: false, error: error.message, debugLog };
    }
}