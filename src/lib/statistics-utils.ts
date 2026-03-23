
import type { FactCategory } from './types';
import { findRelatedColumns } from './excel-processor';

export const getShortCategoryName = (category: string) => {
    switch (category) {
        case 'Активації PrP+PoP': return 'Активації';
        case 'Контракти B2C': return 'B2C';
        case 'Контракти B2B': return 'B2B';
        case 'MNP': return 'MNP';
        case 'Доп Послуги': return 'ДУ';
        case 'Гаджети': return 'Гаджети';
        case 'Підключення Vega': return 'VEGA';
        default: return category;
    }
};

export const getLevelClasses = (item: FactCategory): string => {
    let highestLevel = 0;
    if (item.fact && item.levels && item.levels.length > 0) {
        const factValue = item.fact;
        const levelValues = item.levels.map(l => parseFloat(l.value as string)).filter(v => !isNaN(v));
        for(let i = levelValues.length - 1; i >= 0; i--) {
            if (factValue >= levelValues[i] && levelValues[i] > 0) {
                highestLevel = i + 1;
                break;
            }
        }
    }

    const categoryName = item.category;

    if (['Активації PrP+PoP', 'Контракти B2C', 'MNP'].includes(categoryName)) {
        if (highestLevel === 3) return 'glass-green';
        if (highestLevel === 2) return 'glass-yellow';
        if (highestLevel === 1) return 'achieved'; 
        return 'glass-red';
    }

    if (['Гаджети', 'ДУ'].includes(categoryName)) {
        if (highestLevel >= 1) return 'achieved';
        return 'glass-red';
    }

    if (categoryName === 'VEGA') {
        return highestLevel >= 1 ? 'glass-green' : '';
    }
    
    if (categoryName === 'Контракти B2B') {
        return '';
    }

    if (categoryName === 'NBO') {
        const percentField = item.fields?.find(f => (f.name as string).includes('%'));
        if (!percentField) return '';
        const nboPercent = parseFloat(percentField.value as string) * 100;
        if (isNaN(nboPercent)) return '';
        if (nboPercent >= 70) return 'glass-green';
        if (nboPercent >= 50) return 'glass-yellow';
        return 'glass-red';
    }
    
    return ''; 
};
