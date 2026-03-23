
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { RefreshCw, ArrowLeft } from 'lucide-react';
import type { ProcessedPrpData, OutletGroup } from '@/lib/types';
import { formatOutletName, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type PrpReportProps = {
  prpData: ProcessedPrpData;
  outletGroups: OutletGroup[];
};

export default function PrpReport({ prpData, outletGroups }: PrpReportProps) {
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const handleOutletToggle = (outlet: string) => {
    setSelectedOutlets(prev =>
      prev.includes(outlet)
        ? prev.filter(o => o !== outlet)
        : [...prev, outlet]
    );
  };

  const { filteredReportData, filteredTotals } = useMemo(() => {
    const data = selectedOutlets.length > 0
      ? prpData.data.filter(row => selectedOutlets.includes(row.outlet))
      : prpData.data;

    const totals = {
      outlet: 'Загальний підсумок',
      'Успішно': data.reduce((sum, row) => sum + row['Успішно'], 0),
      'Неуспішно': data.reduce((sum, row) => sum + row['Неуспішно'], 0),
      'У стадії перевірки': data.reduce((sum, row) => sum + row['У стадії перевірки'], 0),
      'Всього': data.reduce((sum, row) => sum + row['Всього'], 0),
    };
    
    return { filteredReportData: data, filteredTotals: totals };
  }, [prpData, selectedOutlets]);

  return (
    <div>
      <div className="text-left mb-4">
          <h2 className="text-2xl font-bold">Звіт по PrP</h2>
      </div>

      <Card className="mb-6 conn-hub-style !bg-gradient-to-br from-black/20 to-black/30 !border-none !shadow-none">
        <CardHeader>
          <CardTitle>Фільтр за аутлетами</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col md:flex-row gap-4">
            {outletGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="flex-1 p-3 rounded-lg bg-background">
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground truncate">{group.fileName}</h4>
                <div className="flex flex-wrap gap-2">
                  {group.outlets.map(outlet => (
                    <Button
                      key={outlet}
                      onClick={() => handleOutletToggle(outlet)}
                      variant={selectedOutlets.includes(outlet) ? 'default' : 'outline'}
                      className="h-8 text-xs"
                    >
                      {formatOutletName(outlet)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {selectedOutlets.length > 0 && (
            <Button onClick={() => setSelectedOutlets([])} variant="destructive" size="sm" className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Скинути фільтри
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="w-full conn-hub-style !bg-gradient-to-br from-black/20 to-black/30 !border-none !shadow-none !p-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Аутлет</TableHead>
                  <TableHead className="font-semibold text-right">Неуспішно</TableHead>
                  <TableHead className="font-semibold text-right">На перевірці</TableHead>
                  <TableHead className="font-semibold text-right">Успішно</TableHead>
                  <TableHead className="font-semibold text-right">Потенціал</TableHead>
                  <TableHead className="font-semibold text-right">Всього</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReportData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-bold">{formatOutletName(row.outlet)}</TableCell>
                    <TableCell className="text-right font-mono">{row['Неуспішно']}</TableCell>
                    <TableCell className="text-right font-mono">{row['У стадії перевірки']}</TableCell>
                    <TableCell className="text-right font-mono">{row['Успішно']}</TableCell>
                    <TableCell className="text-right font-mono">{row['У стадії перевірки'] + row['Успішно']}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{row['Всього']}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold text-lg">{filteredTotals.outlet}</TableCell>
                  <TableCell className="text-right font-bold text-lg font-mono">{filteredTotals['Неуспішно']}</TableCell>
                  <TableCell className="text-right font-bold text-lg font-mono">{filteredTotals['У стадії перевірки']}</TableCell>
                  <TableCell className="text-right font-bold text-lg font-mono">{filteredTotals['Успішно']}</TableCell>
                  <TableCell className="text-right font-bold text-lg font-mono">{filteredTotals['У стадії перевірки'] + filteredTotals['Успішно']}</TableCell>
                  <TableCell className="text-right font-bold text-lg font-mono">{filteredTotals['Всього']}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
