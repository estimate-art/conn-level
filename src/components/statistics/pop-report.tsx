
'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ArrowLeft } from 'lucide-react';
import type { ProcessedPopData } from '@/lib/types';
import { cn, formatOutletName } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type PopReportProps = {
  popData: ProcessedPopData;
};

export default function PopReport({ popData }: PopReportProps) {
  const [checkedRows, setCheckedRows] = useState<{ [key: string]: boolean }>({});
  const [filters, setFilters] = useState({ outlet: 'all', connection: 'all', login: 'all', processed: 'all' });
  const [buttonFilters, setButtonFilters] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const uniqueOptions = useMemo(() => ({
    outlets: [...new Set(popData.details.map(row => row.outlet))].filter(Boolean).sort(),
    connections: [...new Set(popData.details.map(row => row.connection))].filter(Boolean).sort(),
    logins: [...new Set(popData.details.map(row => row.login))].filter(Boolean).sort(),
  }), [popData.details]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleButtonFilterToggle = (outlet: string) => {
    setButtonFilters(prev => 
      prev.includes(outlet) 
        ? prev.filter(o => o !== outlet)
        : [...prev, outlet]
    );
  };

  const filteredDetails = useMemo(() => {
    return popData.details.filter(row => {
      const buttonFilterMatch = buttonFilters.length === 0 || buttonFilters.includes(row.outlet);
      const outletMatch = filters.outlet === 'all' || row.outlet === filters.outlet;
      const connectionMatch = filters.connection === 'all' || row.connection === filters.connection;
      const loginMatch = filters.login === 'all' || row.login === filters.login;
      const processedMatch = filters.processed === 'all' ||
        (filters.processed === 'yes' && !!checkedRows[row.id]) ||
        (filters.processed === 'no' && !checkedRows[row.id]);
      return buttonFilterMatch && outletMatch && connectionMatch && loginMatch && processedMatch;
    });
  }, [popData.details, filters, checkedRows, buttonFilters]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    const summarySheetData = [
      ['Аутлет', 'Неуспішно', 'Успішно', 'Всього'],
      ...popData.summary.data.map(row => [formatOutletName(row.outlet), row['Неуспішно'], row['Успішно'], row['Всього']]),
      ['Загальний підсумок', popData.summary.totals['Неуспішно'], popData.summary.totals['Успішно'], popData.summary.totals['Всього']]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(wb, ws1, 'PoP Зведення');

    const detailsSheetData = filteredDetails.map(row => ({
      'Аутлет': formatOutletName(row.outlet),
      'Неуспішно': 'Так',
      'Причина': row.connection, // Using connection as "Reason"
      'Особовий рахунок': row.account,
      'Номер телефону': row.phone,
      'Чекбокс': checkedRows[row.id] ? 'Так' : 'Ні'
    }));
    const ws2 = XLSX.utils.json_to_sheet(detailsSheetData, {header: ["Аутлет", "Неуспішно", "Причина", "Особовий рахунок", "Номер телефону", "Чекбокс"]});
    XLSX.utils.book_append_sheet(wb, ws2, 'Деталізація');

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getFullYear()).slice(-2)}`;
    const fileName = `PoP_Звіт_${time}_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="text-left">
            <h2 className="text-2xl font-bold">Звіт по B2C PoP</h2>
        </div>
         <Button onClick={handleExport} variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Експорт
        </Button>
      </div>
      
      <Card className="w-full conn-hub-style !bg-gradient-to-br from-black/20 to-black/30 !border-none !shadow-none !p-0">
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Аутлет</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Неуспішно</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Успішно</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Всього</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popData.summary.data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-bold text-xs sm:text-sm">{formatOutletName(row.outlet)}</TableCell>
                    <TableCell className="text-right font-mono text-xs sm:text-sm">{row['Неуспішно']}</TableCell>
                    <TableCell className="text-right font-mono text-xs sm:text-sm">{row['Успішно']}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs sm:text-sm">{row['Всього']}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold text-sm sm:text-lg">{popData.summary.totals.outlet}</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm sm:text-lg">{popData.summary.totals['Неуспішно']}</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm sm:text-lg">{popData.summary.totals['Успішно']}</TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm sm:text-lg">{popData.summary.totals['Всього']}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card className="w-full conn-hub-style !bg-gradient-to-br from-black/20 to-black/30 !border-none !shadow-none !p-0">
         <CardHeader>
          <CardTitle>Фільтр за аутлетами</CardTitle>
          <div className="pt-4">
             <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {uniqueOptions.outlets.map(outlet => (
                <button
                    key={outlet}
                    onClick={() => handleButtonFilterToggle(outlet)}
                    className={cn(
                      "conn-hub-style !p-2 !rounded-xl text-xs h-8",
                      buttonFilters.includes(outlet) && 'achieved'
                    )}
                >
                    {formatOutletName(outlet)}
                </button>
                ))}
             </div>
             {buttonFilters.length > 0 && <Button variant="destructive" onClick={() => setButtonFilters([])} className="mt-4">Скинути</Button>}
          </div>
        </CardHeader>
      </Card>

      <Card className="w-full conn-hub-style !bg-gradient-to-br from-black/20 to-black/30 !border-none !shadow-none !p-0">
        <CardHeader>
          <CardTitle>Неуспішні (деталі)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Аутлет</TableHead>
                <TableHead>Канал</TableHead>
                <TableHead>О/р</TableHead>
                {!isMobile && <TableHead>Логін</TableHead>}
                <TableHead>Телефон</TableHead>
                <TableHead className="text-center">Оброблено</TableHead>
              </TableRow>
               <TableRow className="bg-muted/50">
                   <TableHead className="p-2">
                      <Select value={filters.outlet} onValueChange={(v) => handleFilterChange('outlet', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Всі аутлети</SelectItem>
                              {uniqueOptions.outlets.map(o => <SelectItem key={o} value={o}>{formatOutletName(o)}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </TableHead>
                  <TableHead className="p-2">
                      <Select value={filters.connection} onValueChange={(v) => handleFilterChange('connection', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Всі підключення</SelectItem>
                              {uniqueOptions.connections.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </TableHead>
                   <TableHead></TableHead>
                  {!isMobile && (
                    <TableHead className="p-2">
                        <Select value={filters.login} onValueChange={(v) => handleFilterChange('login', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Всі логіни</SelectItem>
                              {uniqueOptions.logins.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                      </Select>
                    </TableHead>
                  )}
                  <TableHead></TableHead>
                  <TableHead className="p-2">
                       <Select value={filters.processed} onValueChange={(v) => handleFilterChange('processed', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Всі</SelectItem>
                              <SelectItem value="yes">Оброблено</SelectItem>
                              <SelectItem value="no">Не оброблено</SelectItem>
                          </SelectContent>
                      </Select>
                  </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetails.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatOutletName(row.outlet)}</TableCell>
                  <TableCell>{row.connection}</TableCell>
                  <TableCell className="font-mono">{row.account}</TableCell>
                  {!isMobile && <TableCell>{row.login}</TableCell>}
                  <TableCell className="font-mono">{row.phone}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={!!checkedRows[row.id]}
                      onCheckedChange={() => setCheckedRows(prev => ({ ...prev, [row.id]: !prev[row.id] }))}
                      className="w-5 h-5"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
