
import type { OutletData, Achievement, AchievementData, SalesData, ColumnMapping, CodifierTemplate, ProcessedSalesData } from './types';

export const findRelatedColumns = (headers: string[]) => {
    const related: { [key: string]: any } = {};

    const fact1 = headers.find(h => h.includes('Активації PrP+PoP') && h.includes('Факт'));
    if (fact1) {
        related['Активації PrP+PoP'] = {
            fact: fact1,
            levels: [
                headers.find(h => h.includes('Активації PrP+PoP') && h.includes('Рівень1')),
                headers.find(h => h.includes('Активації PrP+PoP') && h.includes('Рівень2')),
                headers.find(h => h.includes('Активації PrP+PoP') && h.includes('Рівень3')),
            ].filter(Boolean),
        };
    }

    const fact3 = headers.find(h => h.includes('Контракти B2C') && h.includes('Факт'));
    if (fact3) {
        related['Контракти B2C'] = {
            fact: fact3,
            levels: [
                headers.find(h => h.includes('Контракти B2C') && h.includes('Рівень1')),
                headers.find(h => h.includes('Контракти B2C') && h.includes('Рівень2')),
                headers.find(h => h.includes('Контракти B2C') && h.includes('Рівень3')),
            ].filter(Boolean),
        };
    }

    const fact_mnp_prp = headers.find(h => h.includes('MNP') && h.includes('PrP Факт'));
    const fact_mnp_pop = headers.find(h => h.includes('MNP') && h.includes('PoP Факт'));
    if (fact_mnp_prp && fact_mnp_pop) {
        related['MNP'] = {
            fact: fact_mnp_prp,
            extraFacts: [{ name: 'PrP Факт', col: fact_mnp_prp }, { name: 'PoP Факт', col: fact_mnp_pop }],
            levels: [
                headers.find(h => h.includes('MNP') && h.includes('Мін.План/Рівень 1')),
                headers.find(h => h.includes('MNP') && h.includes('Рівень 2')),
                headers.find(h => h.includes('MNP') && h.includes('Рівень 3')),
            ].filter(Boolean),
        };
    }

    const fact5 = headers.find(h => h.includes('Контракти B2B') && h.includes('Факт'));
    if (fact5) {
        related['Контракти B2B'] = {
            fact: fact5,
            levels: [
                headers.find(h => h.includes('Контракти B2B') && h.includes('Рівень1')),
                headers.find(h => h.includes('Контракти B2B') && h.includes('Рівень2')),
                headers.find(h => h.includes('Контракти B2B') && h.includes('Рівень3')),
            ].filter(Boolean),
        };
    }

    const fact6 = headers.find(h => h.includes('Акц.Гаджети') && h.includes('Факт'));
    if (fact6) {
        related['Гаджети'] = {
            fact: fact6,
            levels: [
                headers.find(h => h.includes('Акц.Гаджети') && h.includes('Мін.План./Рівень1')),
                headers.find(h => h.includes('Акц.Гаджети') && h.includes('Рівень2')),
                headers.find(h => h.includes('Акц.Гаджети') && h.includes('Рівень3')),
            ].filter(Boolean),
        };
    }

    const fact7 = headers.find(h => h.includes('Доп Послуги') && h.includes('Факт'));
    if (fact7) {
        related['ДУ'] = {
            fact: fact7,
            levels: [
                headers.find(h => h.includes('Доп Послуги') && h.includes('Мін.План./Рівень 1')),
                headers.find(h => h.includes('Доп Послуги') && h.includes('Рівень 2')),
                headers.find(h => h.includes('Доп Послуги') && h.includes('Рівень 3')),
            ].filter(Boolean),
        };
    }

    const fact8_1 = headers.find(h => h.includes('К-сть абонентів з NBO') && !h.includes('презент'));
    const fact8_2 = headers.find(h => h.includes('К-сть абонентів з презент NBO'));
    const fact8_3 = headers.find(h => h.includes('%абонентів з презентованим NBO'));
    if (fact8_1 && fact8_2 && fact8_3) {
        related['NBO'] = {
            fields: [
                { name: 'К-сть абонентів з NBO', col: fact8_1 },
                { name: 'К-сть абонентів з презент NBO', col: fact8_2 },
                { name: '%%абонентів з презентованим NBO', col: fact8_3 }
            ]
        };
    }

    const fact9 = headers.find(h => h.includes('Підключення Vega') && h.includes('факт'));
    if (fact9) {
        related['VEGA'] = {
            fact: fact9,
            levels: [headers.find(h => h.includes('Підключення Vega') && h.includes('план'))].filter(Boolean),
        };
    }
    return related;
};

export const processPrpData = (rawData: any[]) => {
    if (!rawData || rawData.length === 0) return null;
    const statuses = ['Успішно', 'Неуспішно', 'У стадії перевірки'];
    const aggregated = rawData.reduce((acc, row) => {
        const outlet = row['Аутлет'] || 'Не вказано';
        const status = row['Реєстрація'] || 'Не вказано';
        if (!acc[outlet]) {
            acc[outlet] = { outlet, 'Успішно': 0, 'Неуспішно': 0, 'У стадії перевірки': 0, 'Всього': 0 };
        }
        if (statuses.includes(status)) { acc[outlet][status]++; }
        acc[outlet]['Всього']++;
        return acc;
    }, {} as { [key: string]: any });

    const resultData = Object.values(aggregated);
    const totals = {
        outlet: 'Загальний підсумок',
        'Успішно': resultData.reduce((sum, row) => sum + row['Успішно'], 0),
        'Неуспішно': resultData.reduce((sum, row) => sum + row['Неуспішно'], 0),
        'У стадії перевірки': resultData.reduce((sum, row) => sum + row['У стадії перевірки'], 0),
        'Всього': resultData.reduce((sum, row) => sum + row['Всього'], 0),
    };
    return { data: resultData, totals: totals };
};

export const processPopData = (rawData: any[]) => {
    if (!rawData || rawData.length === 0) return null;
    const summaryAggregated = rawData.reduce((acc, row) => {
        const outlet = row['Аутлет'] || 'Не вказано';
        const status = row['Реєстрація'] || 'Не вказано';
        if (!acc[outlet]) {
            acc[outlet] = { outlet, 'Успішно': 0, 'Неуспішно': 0, 'Всього': 0 };
        }
        if (status === 'Успішно') acc[outlet]['Успішно']++;
        if (status === 'Неуспішно') acc[outlet]['Неуспішно']++;
        acc[outlet]['Всього']++;
        return acc;
    }, {} as { [key: string]: any });
    const summaryData = Object.values(summaryAggregated);
    const summaryTotals = {
        outlet: 'Загальний підсумок',
        'Успішно': summaryData.reduce((sum, row) => sum + row['Успішно'], 0),
        'Неуспішно': summaryData.reduce((sum, row) => sum + row['Неуспішно'], 0),
        'Всього': summaryData.reduce((sum, row) => sum + row['Всього'], 0),
    };

    const detailsData = rawData
        .filter(row => row['Реєстрація'] === 'Неуспішно')
        .map((row, index) => {
            let login = row['Логін'] || '';
            if (login && login.includes('\\')) {
                const parts = login.split('.');
                const lastPart = parts[parts.length - 1];
                login = lastPart ? lastPart.substring(0, 5) : '';
            }
            return {
                outlet: row['Аутлет'] || '',
                connection: (row['Підключення'] === 'WEB-інтерфейс' ? 'WEB' : row['Підключення']) || '',
                login: login,
                account: parseInt(row['Особовий рахунок'], 10) || '',
                phone: row['Номер телефону'] || '',
                id: row['Серійний номер SIM картки'] || `${row['Особовий рахунок']}-${index}`
            };
        });
    return { summary: { data: summaryData, totals: summaryTotals }, details: detailsData };
};

export const getOutletDetails = (outletName: string, data: OutletData[]) => {
    if (!outletName || !data || data.length === 0) return null;
    const outletData = data.find(row => row['Аутлет'] === outletName);
    if (!outletData) return null;
    const city = outletData['Місто'];
    const street = outletData['Вулиця'];
    return [city, street].filter(Boolean).join(', ') || null;
};

const getShortCategoryName = (category: string) => {
    switch (category) {
        case 'Активації PrP+PoP': return 'PrP+PoP';
        case 'Контракти B2C': return 'B2C';
        case 'Контракти B2B': return 'B2B';
        case 'MNP': return 'MNP';
        case 'Доп Послуги': return 'ДУ';
        case 'Акц.Гаджети': return 'Гаджети';
        case 'Підключення Vega': return 'VEGA';
        default: return category;
    }
};

export const generateAchievementsForOutlet = (outletData: OutletData): AchievementData => {
    if (!outletData) return { achievements: [], showCoin: false };
    
    const headers = Object.keys(outletData);
    const factColumnsForOutlet = findRelatedColumns(headers);
    
    const categoryLevels: { [key: string]: number } = {};

    const achievements: Achievement[] = Object.keys(factColumnsForOutlet)
        .filter(category => category !== 'NBO' && factColumnsForOutlet[category].levels && factColumnsForOutlet[category].levels.length > 0)
        .map(category => {
            const catData = factColumnsForOutlet[category];
            let factValue: number;
            if (category === 'MNP') {
                const prp = parseFloat(outletData[catData.extraFacts?.[0]?.col] as string) || 0;
                const pop = parseFloat(outletData[catData.extraFacts?.[1]?.col] as string) || 0;
                factValue = prp + pop;
            } else {
                factValue = parseFloat(outletData[catData.fact] as string);
            }

            const levelValues = catData.levels.map((l: string) => parseFloat(outletData[l] as string)).filter((v: number) => !isNaN(v));
            
            let highestLevel = 0;
            for(let i = levelValues.length - 1; i >= 0; i--) {
                if (factValue >= levelValues[i] && levelValues[i] > 0) {
                    highestLevel = i + 1;
                    break;
                }
            }
            if (factValue > 0 && highestLevel === 0 && levelValues.every(v => v === 0)) {
                highestLevel = 1; 
            }
            
            const shortName = getShortCategoryName(category);
            categoryLevels[shortName] = highestLevel;

            let icon = '0🟥';
            let rowBgColor = 'bg-destructive/10';

            const isMaxLevel = highestLevel === levelValues.length && levelValues.length > 0;
            const isOnlyOneLevel = levelValues.length === 1;

            if (highestLevel === 3) {
                icon = '3💸';
                rowBgColor = 'bg-green-500/10';
            } else if (highestLevel === 2) {
                icon = '2🟡';
                rowBgColor = 'bg-yellow-500/10';
            } else if (highestLevel === 1) {
                icon = '1🔵';
                if (isOnlyOneLevel) {
                    rowBgColor = 'bg-green-500/10';
                } else {
                    rowBgColor = 'bg-blue-500/10';
                }
            }
            
            if (isMaxLevel && highestLevel < 3) {
                 rowBgColor = 'bg-green-500/10';
            }

            return {
                icon: icon,
                categoryName: shortName,
                data: `[ ${isNaN(factValue) ? 0 : factValue} / ${levelValues[levelValues.length - 1] || 0} ]`,
                rowColor: rowBgColor,
            };
        });

    const showCoin = (categoryLevels['PrP+PoP'] === 3 &&
                      categoryLevels['B2C'] === 3 &&
                      categoryLevels['MNP'] === 3 &&
                      (categoryLevels['Гаджети'] || 0) >= 1 &&
                      (categoryLevels['ДУ'] || 0) >= 1);

    return { achievements, showCoin };
};


export const applyCodifier = (
    salesData: SalesData[],
    columnMapping: ColumnMapping,
    codifierTemplate: CodifierTemplate
): ProcessedSalesData[] => {
    if (!columnMapping.description || !columnMapping.department || !columnMapping.name || !columnMapping.cost) {
        return [];
    }

    const {
        description: descCol,
        department: deptCol,
        name: nameCol,
        cost: costCol,
        imei: imeiCol,
    } = columnMapping;

    const {
        description: descMapping,
        department: deptMapping,
        code: codeMapping,
        smartphones: smartphoneMapping,
        index: indexMapping,
    } = codifierTemplate;

    const codeKeywords = Object.keys(codeMapping).sort((a, b) => b.length - a.length);
    const smartphoneKeywords = Object.keys(smartphoneMapping).sort((a, b) => b.length - a.length);

    return salesData.map(row => {
        const rawDesc = row[descCol!] as string;
        const rawDept = row[deptCol!] as string;
        const rawName = row[nameCol!] as string;
        const rawCost = parseFloat(row[costCol!] as string) || 0;
        const hasImei = imeiCol ? !!row[imeiCol] : false;

        let employee = descMapping[rawDesc] || rawDesc;
        if (!employee || (typeof employee === 'string' && employee.trim() === '')) {
            employee = '-';
        }
        
        const department = deptMapping[rawDept] || rawDept;

        let code = 'N/A';
        
        if (hasImei) {
            const matchingKeyword = smartphoneKeywords.find(keyword => rawName.toLowerCase().includes(keyword.toLowerCase()));
            if (matchingKeyword) {
                code = smartphoneMapping[matchingKeyword];
            }
        } else {
            const matchingKeyword = codeKeywords.find(keyword => rawName.toLowerCase().includes(keyword.toLowerCase()));
            if (matchingKeyword) {
                code = codeMapping[matchingKeyword];
            }
        }
        
        const index = indexMapping[code] || null;

        return {
            employee,
            department,
            name: rawName,
            cost: rawCost,
            code,
            index,
            imei: imeiCol ? (row[imeiCol] as string | null) : null,
        };
    });
};

    
