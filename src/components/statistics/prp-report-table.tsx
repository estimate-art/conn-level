
'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import type { ProcessedPrpData } from '@/lib/types';
import { formatOutletName } from '@/lib/utils';

type PrpReportTableProps = {
  prpData: ProcessedPrpData;
  selectedOutlets: string[];
};

export default function PrpReportTable({ prpData, selectedOutlets }: PrpReportTableProps) {
    const data = useMemo(() => {
        const filtered = selectedOutlets.length > 0
            ? prpData.data.filter(row => selectedOutlets.includes(row.outlet))
            : prpData.data;
        const totals = {
            outlet: 'Загальний підсумок',
            'Успішно': filtered.reduce((s, r) => s + r['Успішно'], 0),
            'Неуспішно': filtered.reduce((s, r) => s + r['Неуспішно'], 0),
            'У стадії перевірки': filtered.reduce((s, r) => s + r['У стадії перевірки'], 0),
            'Всього': filtered.reduce((s, r) => s + r['Всього'], 0),
        };
        return { data: filtered, totals };
    }, [prpData, selectedOutlets]);

    return (
        <Card className="conn-hub-style">
            <CardHeader><CardTitle>Звіт PrP</CardTitle></CardHeader>
            <CardContent className="!p-2">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Аутлет</TableHead>
                            <TableHead className="text-right">Неусп.</TableHead>
                            <TableHead className="text-right">Перев.</TableHead>
                            <TableHead className="text-right">Успішно</TableHead>
                            <TableHead className="text-right">Всього</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.map(row => (
                            <TableRow key={row.outlet}>
                                <TableCell className="whitespace-nowrap">{formatOutletName(row.outlet)}</TableCell>
                                <TableCell className="text-right font-mono">{row['Неуспішно']}</TableCell>
                                <TableCell className="text-right font-mono">{row['У стадії перевірки']}</TableCell>
                                <TableCell className="text-right font-mono">{row['Успішно']}</TableCell>
                                <TableCell className="text-right font-mono">{row['Всього']}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    {data.data.length > 1 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold">Підсумок</TableCell>
                                <TableCell className="text-right font-bold font-mono">{data.totals['Неуспішно']}</TableCell>
                                <TableCell className="text-right font-bold font-mono">{data.totals['У стадії перевірки']}</TableCell>
                                <TableCell className="text-right font-bold font-mono">{data.totals['Успішно']}</TableCell>
                                <TableCell className="text-right font-bold font-mono">{data.totals['Всього']}</TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </CardContent>
        </Card>
    );
}
