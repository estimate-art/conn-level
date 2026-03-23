import { promises as fs } from 'fs';
import path from 'path';
import type { ProductCategory, Branch, Warehouse, SalesConfig } from '@/lib/types';

// --- Constants ---
export const BASE_URL = 'https://api.remonline.app';
export const CHUNK_SIZE = 30;

// --- Cache Paths ---
export const CATEGORY_CACHE_PATH = path.join(process.cwd(), 'src', 'lib', 'categories.cache.json');
export const INFRA_CACHE_PATH = path.join(process.cwd(), 'src', 'lib', 'warehouse-branch-map.cache.json');

// --- Helper for Auth ---
/**
 * Отримує дійсний тимчасовий токен, обмінюючи API-ключ.
 * Використовує вбудоване кешування Next.js для повторного використання токена протягом години.
 */
export async function getValidToken(): Promise<string> {
    const apiKey = process.env.REMONLINE_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('API ключ (REMONLINE_API_KEY) не налаштований у змінних оточення на сервері.');
    }

    try {
        const response = await fetch(`${BASE_URL}/token/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey.trim() }),
            next: { revalidate: 3500 } // Кешуємо токен трохи менше години (стандарт життя токена - 1 год)
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(`Помилка авторизації RemOnline: ${data.message || 'Невідома помилка'}`);
        }
        return data.token;
    } catch (e: any) {
        throw new Error(`Не вдалося отримати токен авторизації: ${e.message}`);
    }
}

// Використовується лише для діагностичних перевірок суфікса
export function getApiKey(): string {
    const apiKey = process.env.REMONLINE_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('API ключ (REMONLINE_API_KEY) не налаштований у змінних оточення на сервері.');
    }
    return apiKey.trim();
}

// --- Generic Cache Handling ---
type CacheContainer<T> = {
    last_updated: string;
    data: T;
};

export async function readCache<T>(filePath: string): Promise<CacheContainer<T> | null> {
    try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (e) {
        return null;
    }
}

export async function writeCache<T>(filePath: string, data: T): Promise<void> {
    const cacheContainer: CacheContainer<T> = {
        last_updated: new Date().toISOString(),
        data: data,
    };
    try {
        await fs.writeFile(filePath, JSON.stringify(cacheContainer, null, 2), 'utf8');
    } catch (e) {
        console.warn('Failed to write cache to file (possibly read-only filesystem):', filePath);
    }
}

// --- Error Handling ---
export async function handleApiError(response: Response) {
    let errorBody;
    const contentType = response.headers.get('content-type');
    try {
        if (contentType && contentType.includes('application/json')) {
            errorBody = await response.json();
        } else {
            errorBody = await response.text();
        }
    } catch (e) {
        errorBody = await response.text();
    }
    return { status: response.status, statusText: response.statusText, body: errorBody };
}

export function formatApiError(error: { status: number, statusText: string, body: any }): string {
    let bodyString = typeof error.body === 'object' ? JSON.stringify(error.body, null, 2) : String(error.body);
    return `Помилка API (${error.status} ${error.statusText}): ${bodyString}`;
}

// --- Infrastructure & Cache Layer ---

export async function getSalesConfig(): Promise<SalesConfig> {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'sales.config.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
};

export async function getInfrastructure(forceRefresh: boolean = false): Promise<{ branches: Branch[], warehouses: Warehouse[] }> {
    // Отримуємо динамічний токен
    const token = await getValidToken();
    
    if (!forceRefresh) {
        const cache = await readCache<{ branches: Branch[], warehouses: Warehouse[] }>(INFRA_CACHE_PATH);
        const today = new Date().toISOString().split('T')[0];

        if (cache && new Date(cache.last_updated).toISOString().split('T')[0] === today && cache.data.branches && cache.data.warehouses) {
            return cache.data;
        }
    }

    const branchesUrl = new URL(`${BASE_URL}/branches/`);
    branchesUrl.searchParams.set('token', token);
    
    const warehouseUrl = new URL(`${BASE_URL}/warehouse/`);
    warehouseUrl.searchParams.set('token', token);

    const [branchesRes, warehouseRes] = await Promise.all([
        fetch(branchesUrl.toString(), { cache: 'no-store' }),
        fetch(warehouseUrl.toString(), { cache: 'no-store' })
    ]);

    if (!warehouseRes.ok) throw new Error(formatApiError(await handleApiError(warehouseRes)));
    if (!branchesRes.ok) throw new Error(formatApiError(await handleApiError(branchesRes)));

    const branchesData = await branchesRes.json();
    const warehousesData = await warehouseRes.json();
    
    const infrastructure = {
        branches: branchesData.data || [],
        warehouses: warehousesData.data || []
    };

    await writeCache(INFRA_CACHE_PATH, infrastructure);

    return infrastructure;
}

export async function getWarehouseBranchMap(): Promise<Map<number, string>> {
    const { branches, warehouses } = await getInfrastructure();
    
    const branchMap = new Map(branches.map(b => [b.id, b.name]));
    
    const warehouseBranchMap = new Map<number, string>();
    warehouses.forEach(w => {
        if (w.branch_id) {
            warehouseBranchMap.set(w.id, branchMap.get(w.branch_id) || 'Unknown Branch');
        }
    });

    return warehouseBranchMap;
}