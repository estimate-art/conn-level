'use server';

import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { processSales } from '@/lib/sales-processor';
import type { RemOnlineSale, ViewableSale, ProcessedSale } from '@/lib/types';
import { BASE_URL, getSalesConfig, handleApiError, formatApiError, getApiKey, getValidToken } from './remonline-shared';

function flattenProcessedSales(processedSales: ProcessedSale[]): ViewableSale[] {
    const viewableSales: ViewableSale[] = [];
    for (const sale of processedSales) {
        const saleWideReasons = sale.reviewReasons.filter(r => !r.startsWith('Неоднозначний товар:'));
        for (const product of sale.products) {
            const productSpecificReasons: string[] = [];
            if (product.isAmbiguous || product.category === 'Unknown') {
                productSpecificReasons.push(`Неоднозначний або невідомий товар: "${product.title}"`);
            }
            const allReasons = [...saleWideReasons, ...productSpecificReasons];
            const finalStatus = allReasons.length > 0 ? 'NEEDS_REVIEW' : 'PROCESSED';
            viewableSales.push({
                id_label: sale.id_label,
                timestamp: sale.timestamp,
                department: sale.department.label,
                seller: sale.seller.name,
                category: product.category === 'Unknown' ? '--' : product.category,
                title: product.title,
                total: product.total,
                clientName: sale.clientName,
                status: finalStatus,
                reviewReasons: allReasons,
            });
        }
    }
    return viewableSales;
}

export async function getSales(period: 'day' | 'week' | 'month' | 'last-day' | 'last-week' | 'last-month', forDate?: Date) {
    let token: string;
    try {
        token = await getValidToken();
    } catch (e: any) {
        return { success: false, error: e.message };
    }
    
    const timeZone = 'Europe/Kiev';
    const referenceDate = forDate ? toZonedTime(forDate, timeZone) : toZonedTime(new Date(), timeZone);
    
    let startDate: Date, endDate: Date;

    if (forDate) {
        // Logic for specific date with period context
        if (period === 'week') {
            startDate = startOfWeek(referenceDate, { weekStartsOn: 1 });
            endDate = endOfWeek(referenceDate, { weekStartsOn: 1 });
        } else if (period === 'month') {
            startDate = startOfMonth(referenceDate);
            endDate = endOfMonth(referenceDate);
        } else {
            startDate = startOfDay(referenceDate);
            endDate = endOfDay(referenceDate);
        }
    } else {
        switch (period) {
            case 'week': startDate = startOfWeek(referenceDate, { weekStartsOn: 1 }); endDate = endOfWeek(referenceDate, { weekStartsOn: 1 }); break;
            case 'month': startDate = startOfMonth(referenceDate); endDate = endOfMonth(referenceDate); break;
            case 'last-day':
                const lastDay = subDays(referenceDate, 1);
                startDate = startOfDay(lastDay);
                endDate = endOfDay(lastDay);
                break;
            case 'last-week':
                const prevWeek = subWeeks(referenceDate, 1);
                startDate = startOfWeek(prevWeek, { weekStartsOn: 1 });
                endDate = endOfWeek(prevWeek, { weekStartsOn: 1 });
                break;
            case 'last-month':
                const prevMonth = subMonths(referenceDate, 1);
                startDate = startOfMonth(prevMonth);
                endDate = endOfMonth(prevMonth);
                break;
            case 'day':
            default: startDate = startOfDay(referenceDate); endDate = endOfDay(referenceDate); break;
        }
    }
    
    const dateFrom = fromZonedTime(startDate, timeZone).getTime();
    const dateTo = fromZonedTime(endDate, timeZone).getTime();
    
    try {
        const url = new URL(`${BASE_URL}/retail/sales/`);
        url.searchParams.set('token', token);
        url.searchParams.append('created_at[]', String(dateFrom));
        url.searchParams.append('created_at[]', String(dateTo));
        url.searchParams.set('include', 'products,client');
        
        const response = await fetch(url.toString(), { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' });
        if (!response.ok) return { success: false, error: formatApiError(await handleApiError(response)) };
        
        const rawData = await response.json();
        
        if (rawData && rawData.success === false) {
            return { success: false, error: rawData.message || 'API помилка' };
        }

        const rawSales: RemOnlineSale[] = rawData?.data || [];
        const salesConfig = await getSalesConfig();
        const processedData = processSales(rawSales, salesConfig);
        const viewableData = flattenProcessedSales(processedData);
        return { success: true, count: viewableData.length, data: viewableData };
    } catch (error: any) {
        console.error('RemOnline API Error:', error);
        return { success: false, error: error.message || 'Сталася невідома помилка під час отримання продажів.' };
    }
}

async function fetchSalesForPeriod(startDate: Date, endDate: Date): Promise<ViewableSale[]> {
    const token = await getValidToken();

    const timeZone = 'Europe/Kiev';
    const dateFrom = fromZonedTime(startOfDay(startDate), timeZone).getTime();
    const dateTo = fromZonedTime(endOfDay(endDate), timeZone).getTime();

    const url = new URL(`${BASE_URL}/retail/sales/`);
    url.searchParams.set('token', token);
    url.searchParams.append('created_at[]', String(dateFrom));
    url.searchParams.append('created_at[]', String(dateTo));
    url.searchParams.set('include', 'products,client');
    
    const response = await fetch(url.toString(), { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' });

    if (!response.ok) {
        const err = await handleApiError(response);
        throw new Error(formatApiError(err));
    }

    const rawData = await response.json();
    
    if (rawData && rawData.success === false) {
        throw new Error(rawData.message || 'API Error');
    }

    const rawSales: RemOnlineSale[] = rawData?.data || [];
    const salesConfig = await getSalesConfig();
    const processedData = processSales(rawSales, salesConfig);
    return flattenProcessedSales(processedData);
}

export async function getSalesReports(period: 'today' | 'this_week' | 'this_month') {
    const timeZone = 'Europe/Kiev';
    const refDate = toZonedTime(new Date(), timeZone);
    
    let currentStartDate: Date, currentEndDate: Date, previousStartDate: Date, previousEndDate: Date;

    switch (period) {
        case 'this_week':
            currentStartDate = startOfWeek(refDate, { weekStartsOn: 1 });
            currentEndDate = endOfWeek(refDate, { weekStartsOn: 1 });
            const prevWeekDate = subWeeks(refDate, 1);
            previousStartDate = startOfWeek(prevWeekDate, { weekStartsOn: 1 });
            previousEndDate = endOfWeek(prevWeekDate, { weekStartsOn: 1 });
            break;
        case 'this_month':
            currentStartDate = startOfMonth(refDate);
            currentEndDate = endOfMonth(refDate);
            const prevMonthDate = subMonths(refDate, 1);
            previousStartDate = startOfMonth(prevMonthDate);
            previousEndDate = endOfMonth(prevMonthDate);
            break;
        case 'today':
        default:
            currentStartDate = startOfDay(refDate);
            currentEndDate = endOfDay(refDate);
            const prevDayDate = subDays(refDate, 1);
            previousStartDate = startOfDay(prevDayDate);
            previousEndDate = endOfDay(prevDayDate);
            break;
    }
    
    try {
        const [currentSales, previousSales] = await Promise.all([
            fetchSalesForPeriod(currentStartDate, currentEndDate),
            fetchSalesForPeriod(previousStartDate, previousEndDate),
        ]);

        return { 
            success: true, 
            data: { 
                current: currentSales, 
                previous: previousSales,
            } 
        };
    } catch (error: any) {
        console.error('RemOnline Sales Reports Error:', error);
        return { success: false, error: error.message || 'Сталася помилка під час формування звітів.' };
    }
}

export async function getSalesForCustomPeriod(startDate: Date, endDate: Date) {
    try {
        const sales = await fetchSalesForPeriod(startDate, endDate);
        return { 
            success: true, 
            data: sales,
            count: sales.length,
        };
    } catch (error: any) {
        console.error('RemOnline Custom Period Sales Error:', error);
        return { success: false, error: error.message || 'Сталася помилка під час отримання даних за період.' };
    }
}