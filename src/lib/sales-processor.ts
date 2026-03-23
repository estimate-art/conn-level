

import Fuse from 'fuse.js';
import type { RemOnlineSale, SalesConfig, ProcessedSale, ClassifiedProduct, DepartmentConfig, CategoryRule, SellerAliases } from './types';

// --- Helper Functions ---

function resolveDepartment(id_label: string, sellerName: string, departments: DepartmentConfig[]): { label: string, reason: string | null } {
    // 1. Check if seller name matches a department label (for cases like "Фуршет")
    const deptFromSeller = departments.find(d => d.label === sellerName);
    if (deptFromSeller) {
        return { label: deptFromSeller.label, reason: null };
    }

    // 2. Check by keyword in id_label
    if (!id_label) {
        return { label: 'Невідомо', reason: 'Відділ не вказано у чеку' };
    }
    const upperIdLabel = id_label.toUpperCase();
    const foundDept = departments.find(d => upperIdLabel.includes(d.key));

    if (foundDept) {
        return { label: foundDept.label, reason: null };
    }

    // 3. Fallback and generate reason for review
    let cleanLabel = id_label.replace(/^ID:\s*/i, '').trim(); 
    cleanLabel = cleanLabel.replace(/^\d+/, ''); 

    return { label: cleanLabel || 'Невідомо', reason: `Невпізнаний відділ: "${id_label}"` };
}

function resolveSeller(description: string, createdById: number, sellers: SellerAliases): { name: string, reason: string | null } {
    const rawDesc = (description || '').toLowerCase().trim();
    
    // 1. Check for User ID alias first
    if (createdById) {
        const userIdAlias = `user id: ${createdById}`;
        if (sellers[userIdAlias.toLowerCase()]) {
            return { name: sellers[userIdAlias.toLowerCase()], reason: null };
        }
    }
    
    // 2. Check for description alias
    if (rawDesc) {
        const sortedAliases = Object.keys(sellers).sort((a, b) => b.length - a.length);
        const sellerAlias = sortedAliases.find(alias => rawDesc.includes(alias.toLowerCase()));

        if (sellerAlias) {
            return { name: sellers[sellerAlias], reason: null };
        }
        if (description) {
          return { name: description, reason: `Невпізнаний продавець: "${description}"` };
        }
    }

    // 3. Fallback for unmapped User ID
    if (createdById) {
         return { name: `User ID: ${createdById}`, reason: `Невпізнаний продавець за ID: ${createdById}` };
    }

    return { name: 'Не визначено', reason: 'Продавець не вказаний' };
}


function classifyProduct(product: { title: string, price: number, amount: number }, rules: CategoryRule[]): ClassifiedProduct {
    const cleanTitle = (product.title || '').toLowerCase().trim();
    if (!cleanTitle) {
        return {
            title: product.title || 'Без назви',
            category: 'Unknown',
            isAmbiguous: true,
            price: product.price,
            amount: product.amount,
            total: (product.price || 0) * (product.amount || 0),
        };
    }
    
    const exactMatches = rules.filter(rule => 
        rule.tags.some(tag => cleanTitle.includes(tag.toLowerCase()))
    );

    if (exactMatches.length > 0) {
        exactMatches.sort((a, b) => b.priority - a.priority);
        const bestMatch = exactMatches[0];
        const isAmbiguous = exactMatches.length > 1 && exactMatches[0].priority === exactMatches[1].priority;
        return {
            title: product.title,
            category: bestMatch.label,
            isAmbiguous: isAmbiguous,
            price: product.price,
            amount: product.amount,
            total: product.price * product.amount,
        };
    }

    const fuse = new Fuse(rules, {
        keys: ['tags'],
        threshold: 0.4,
        includeScore: true,
        shouldSort: true,
    });

    const fuzzyResults = fuse.search(cleanTitle);

    if (fuzzyResults.length === 0) {
        return {
            title: product.title,
            category: 'Unknown',
            isAmbiguous: true,
            price: product.price,
            amount: product.amount,
            total: product.price * product.amount,
        };
    }

    fuzzyResults.sort((a, b) => {
        if (a.item.priority !== b.item.priority) {
            return b.item.priority - a.item.priority;
        }
        return a.score! - b.score!;
    });
    
    const bestMatch = fuzzyResults[0];
    const confidence = 1 - (bestMatch.score || 1);
    
    let isAmbiguous = false;
    if (fuzzyResults.length > 1) {
        const nextMatch = fuzzyResults[1];
        if (nextMatch.item.priority === bestMatch.item.priority) {
            const scoreDifference = Math.abs((nextMatch.score || 1) - (bestMatch.score || 1));
            if (scoreDifference < 0.1) {
                isAmbiguous = true;
            }
        }
    }
    
    if (confidence < 0.6) {
        isAmbiguous = true;
    }

    return {
        title: product.title,
        category: bestMatch.item.label,
        isAmbiguous,
        price: product.price,
        amount: product.amount,
        total: product.price * product.amount,
    };
}


// --- Main Processing Function ---
export function processSales(rawSales: RemOnlineSale[], config: SalesConfig): ProcessedSale[] {
    return rawSales.map(sale => {
        const reviewReasons: string[] = [];

        const sellerResult = resolveSeller(sale.description, sale.created_by_id, config.sellers);
        const departmentResult = resolveDepartment(sale.id_label, sellerResult.name, config.departments);
        
        if (departmentResult.reason) {
            reviewReasons.push(departmentResult.reason);
        }
        if (sellerResult.reason) {
            reviewReasons.push(sellerResult.reason);
        }

        const clientName = sale.client?.name || '--';

        const products: ClassifiedProduct[] = (sale.products || [])
            .map(op => classifyProduct({
                title: op.title,
                price: op.price || 0,
                amount: op.amount || 0
            }, config.rules));
        
        if (products.length === 0) {
            return null; // Don't process sales with no products
        }

        products.forEach(p => {
             if (p.isAmbiguous || p.category === 'Unknown') {
                reviewReasons.push(`Неоднозначний товар: "${p.title}"`);
             }
        });

        const status = reviewReasons.length > 0 ? 'NEEDS_REVIEW' : 'PROCESSED';

        return {
            originalId: sale.id,
            id_label: sale.id_label,
            timestamp: sale.created_at,
            department: { label: departmentResult.label },
            seller: { name: sellerResult.name },
            clientName,
            products,
            status,
            reviewReasons,
        };
    }).filter((sale): sale is ProcessedSale => sale !== null);
}
