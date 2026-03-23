'use server';

import { startOfDay, endOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { promises as fs } from 'fs';
import path from 'path';
import type { SalesConfig, ProductCategory, Branch, Warehouse } from '@/lib/types';
import { 
    BASE_URL, 
    handleApiError, 
    readCache, 
    CATEGORY_CACHE_PATH, 
    INFRA_CACHE_PATH,
    getInfrastructure,
    writeCache,
    formatApiError,
    getApiKey,
    getValidToken
} from './remonline-shared';

export async function checkApiKeyStatus() {
    try {
        const key = getApiKey();
        const suffix = key.slice(-5);
        return { 
            configured: true, 
            message: `API-ключ успішно виявлено на сервері.`,
            suffix: suffix
        };
    } catch (error: any) {
        return { 
            configured: false, 
            message: error.message || 'API-ключ не налаштований.' 
        };
    }
}

export async function updateSalesConfig(newConfig: SalesConfig) {
    try {
        const filePath = path.join(process.cwd(), 'src', 'lib', 'sales.config.json');
        await fs.writeFile(filePath, JSON.stringify(newConfig, null, 2), 'utf8');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to write sales config:', error);
        return { success: false, error: error.message || 'Не вдалося записати файл конфігурації.' };
    }
}

export async function testApiConnection(date: Date) {
    let token: string;
    try {
        token = await getValidToken();
    } catch (e: any) {
        return { success: false, error: { message: e.message } };
    }
    
    const timeZone = 'Europe/Kiev';
    const zonedDate = toZonedTime(date, timeZone);
    const startDate = startOfDay(zonedDate);
    const endDate = endOfDay(zonedDate);

    const dateFrom = fromZonedTime(startDate, timeZone).getTime();
    const dateTo = fromZonedTime(endDate, timeZone).getTime();

    try {
        const url = new URL(`${BASE_URL}/retail/sales/`);
        url.searchParams.set('token', token);
        url.searchParams.append('created_at[]', String(dateFrom));
        url.searchParams.append('created_at[]', String(dateTo));
        url.searchParams.set('include', 'client');
        
        const response = await fetch(url.toString(), { 
            method: 'GET', 
            headers: { 'Accept': 'application/json' }, 
            cache: 'no-store' 
        });
        
        if (!response.ok) {
            return { success: false, error: await handleApiError(response) };
        }
        
        const rawData = await response.json();
        
        if (rawData.success === false) {
            return { success: false, error: { message: rawData.message || 'API повернув success: false' } };
        }

        return { success: true, count: rawData.count, data: rawData.data?.slice(0, 5) || [] };
    } catch (error: any) {
        console.error('RemOnline Test API Error:', error);
        return { success: false, error: { message: error.message || 'Сталася невідома помилка під час запиту.' } };
    }
}

export async function debugApiRequest(apiUrl: string) {
    let finalUrl = apiUrl;
    let token: string;
    try {
        token = await getValidToken();
    } catch (e: any) {
        return { success: false, error: e.message };
    }

    // Замінюємо старий плейсхолдер або додаємо токен автоматично
    if (finalUrl.includes('{API_KEY}')) {
        finalUrl = finalUrl.replace('{API_KEY}', encodeURIComponent(token));
    } else if (!finalUrl.includes('token=')) {
        try {
            const urlObj = new URL(finalUrl);
            urlObj.searchParams.set('token', token);
            finalUrl = urlObj.toString();
        } catch (e) {
            // Якщо URL неповний або некоректний, просто додаємо параметр
            finalUrl = finalUrl.includes('?') ? `${finalUrl}&token=${token}` : `${finalUrl}?token=${token}`;
        }
    }
    
    try {
        const response = await fetch(finalUrl, { cache: 'no-store' });
        
        if (!response.ok) {
            return { success: false, error: await handleApiError(response) };
        }

        const data = await response.json();
        return { success: true, data: data };

    } catch (error: any) {
        return { success: false, error: { message: error.message || 'Сталася помилка під час налагоджувального запиту.' } };
    }
}

export async function getCacheInfo() {
    try {
        const categories = await readCache<ProductCategory[]>(CATEGORY_CACHE_PATH);
        const infra = await readCache<{ branches: Branch[], warehouses: Warehouse[] }>(INFRA_CACHE_PATH);
        return { success: true, data: { categories, infra } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCategories(forceRefresh: boolean = false): Promise<{ success: boolean, data?: ProductCategory[], error?: string, rawData?: any }> {
    let token: string;
    try {
        token = await getValidToken();
    } catch (e: any) {
        return { success: false, error: e.message };
    }

    if (!forceRefresh) {
        const cache = await readCache<ProductCategory[]>(CATEGORY_CACHE_PATH);
        const today = new Date().toISOString().split('T')[0];

        if (cache && new Date(cache.last_updated).toISOString().split('T')[0] === today) {
            return { success: true, data: cache.data };
        }
    }

    try {
        const url = new URL(`${BASE_URL}/warehouse/categories/`);
        url.searchParams.set('token', token);
        
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) {
            const error = await handleApiError(res);
            return { success: false, error: formatApiError(error), rawData: error.body };
        }
        const jsonData = await res.json();
        
        if (jsonData.success === false) {
            return { success: false, error: jsonData.message || 'API Error' };
        }

        const allCategories = jsonData.data || [];
        const rootCategories = allCategories.filter((c: ProductCategory) => !c.parent_id);
        
        await writeCache(CATEGORY_CACHE_PATH, rootCategories);

        return { success: true, data: rootCategories, rawData: jsonData };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function refreshAllCaches() {
    try {
        const categoriesResult = await getCategories(true);
        if (!categoriesResult.success) {
            return { success: false, error: categoriesResult.error, rawCategories: categoriesResult.rawData };
        }

        await getInfrastructure(true);
        
        const cacheInfo = await getCacheInfo();
        return { success: true, data: cacheInfo.data, rawCategories: categoriesResult.rawData };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}