
import * as XLSX from 'xlsx';
import type { OrderData, OrderColumnMapping } from './types';

const extractBrandFromRow = (name: string): string | null => {
    if (!name) return null;
    const words = name.split(' ');
    // Find the first word that starts with a Latin character
    const brand = words.find(word => /^[A-Za-z]/.test(word));
    return brand || null;
};


export const processOrderFile = (fileBinaryString: string, mapping: OrderColumnMapping): Promise<OrderData[]> => {
    return new Promise((resolve, reject) => {
        try {
            const { headerRow, code: codeCol, name: nameCol, quantity: quantityCol, priceColumn } = mapping;

            if (!nameCol || !quantityCol || !priceColumn || !codeCol) {
                return reject(new Error("Налаштування парсингу неповні."));
            }

            const workbook = XLSX.read(fileBinaryString, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                 return reject(new Error("У файлі Excel не знайдено жодного аркуша."));
            }
            const ws = workbook.Sheets[sheetName];
            
            const sheetData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

            const headerRowIndex = headerRow - 1;
            if (headerRowIndex < 0 || headerRowIndex >= sheetData.length) {
                return reject(new Error(`Вказаний рядок заголовків (${headerRow}) знаходиться поза межами файлу.`));
            }
            
            const headers = sheetData[headerRowIndex].map(h => h ? String(h).trim() : '');
            
            const nameIndex = headers.indexOf(nameCol);
            if (nameIndex === -1) {
                return reject(new Error(`Стовпець для 'Асортимент' ('${nameCol}') не знайдено в заголовках. Перевірте номер рядка та налаштування.`));
            }
            
            const codeIndex = headers.indexOf(codeCol);
            const quantityIndex = headers.indexOf(quantityCol);
            const priceColIndex = XLSX.utils.decode_col(priceColumn);
            
            if (codeIndex === -1) {
                return reject(new Error(`Стовпець для 'Код' ('${codeCol}') не знайдено в заголовках.`));
            }
            if (quantityIndex === -1) {
                 return reject(new Error(`Стовпець для 'К-сть' ('${quantityCol}') не знайдено в заголовках.`));
            }
            
            const dataRows: any[][] = sheetData.slice(headerRowIndex + 1);

            const processedData: OrderData[] = [];
            
            dataRows.forEach((row, rowIndex) => {
                if (!row || row.length === 0) return;

                const name = row[nameIndex];
                if (!name) return;

                const quantityRaw = row[quantityIndex];
                const priceRaw = row[priceColIndex];
                const codeRaw = row[codeIndex];
                
                const quantity = Number(quantityRaw) || 0;
                const price = Number(priceRaw) || 0;
                
                if (name) { // Add item if there is a name. Quantity can be 0.
                    processedData.push({
                        id: `${codeRaw || 'nocode'}-${rowIndex}`,
                        code: codeRaw ? String(codeRaw) : null,
                        name: String(name),
                        quantity,
                        price,
                        brand: null, // Placeholder for future brand logic
                    });
                }
            });

            resolve(processedData);

        } catch (error) {
            console.error("processOrderFile: Критична помилка:", error);
            reject(new Error("Помилка обробки файлу замовлення."));
        }
    });
};
