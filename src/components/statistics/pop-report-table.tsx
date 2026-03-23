
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProcessedPopData } from '@/lib/types';
import { formatOutletName } from '@/lib/utils';

type PopReportTableProps = {
  popData: ProcessedPopData;
  selectedOutlets: string[];
};


export default function PopReportTable({ popData, selectedOutlets }: PopReportTableProps) {
    const [checkedRows, setCheckedRows] = useState<{ [key: string]: boolean }>({});
    const [filters, setFilters] = useState({ connection: 'all', login: 'all', processed: 'all' });
    
    const { summary, details } = useMemo(() => {
        const outletsWithData = [...new Set(popData.summary.data.map(r => r.outlet))];
        const relevantOutlets = selectedOutlets.length > 0 ? selectedOutlets : outletsWithData;

        const filteredDetails = popData.details.filter(row => {
            const outletMatch = relevantOutlets.includes(row.outlet);
            if(!outletMatch) return false;
            
            const connectionMatch = filters.connection === 'all' || row.connection === filters.connection;
            const loginMatch = filters.login === 'all' || row.login === filters.login;
            const processedMatch = filters.processed === 'all' || (filters.processed === 'yes' && !!checkedRows[row.id]) || (filters.processed === 'no' && !checkedRows[row.id]);
            return connectionMatch && loginMatch && processedMatch;
        });

        const summaryData = relevantOutlets.map(outlet => {
            const outletSummary = popData.summary.data.find(s => s.outlet === outlet);
            return outletSummary || { outlet, 'Неуспішно': 0, 'Успішно': 0, 'Всього': 0 };
        }).filter(s => s.Всього > 0);

        const totals = {
            'Неуспішно': summaryData.reduce((s, r) => s + r['Неуспішно'], 0),
            'Успішно': summaryData.reduce((s, r) => s + r['Успішно'], 0),
            'Всього': summaryData.reduce((s, r) => s + r['Всього'], 0),
        };

        return { summary: { data: summaryData, totals }, details: filteredDetails };
    }, [popData, selectedOutlets, filters, checkedRows]);
    
    const uniqueOptions = useMemo(() => ({
        connections: [...new Set(popData.details.map(row => row.connection))].filter(Boolean).sort(),
        logins: [...new Set(popData.details.map(row => row.login))].filter(Boolean).sort(),
    }), [popData.details]);
    
    const handleFilterChange = (name: string, value: string) => setFilters(prev => ({ ...prev, [name]: value }));

    return (
        <Card className="conn-hub-style">
            <CardHeader><CardTitle>Звіт PoP</CardTitle></CardHeader>
            <CardContent className="!p-2 flex flex-col gap-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Аутлет</TableHead>
                            <TableHead className="text-right">Неусп.</TableHead>
                            <TableHead className="text-right">Успішно</TableHead>
                            <TableHead className="text-right">Всього</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {summary.data.map(row => (
                            <TableRow key={row.outlet}>
                                <TableCell className="whitespace-nowrap">{formatOutletName(row.outlet)}</TableCell>
                                <TableCell className="text-right font-mono">{row['Неуспішно']}</TableCell>
                                <TableCell className="text-right font-mono">{row['Успішно']}</TableCell>
                                <TableCell className="text-right font-mono">{row['Всього']}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                     {summary.data.length > 1 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold">Підсумок</TableCell>
                                <TableCell className="text-right font-bold font-mono">{summary.totals['Неуспішно']}</TableCell>
                                <TableCell className="text-right font-bold font-mono">{summary.totals['Успішно']}</TableCell>
                                <TableCell className="text-right font-bold font-mono">{summary.totals['Всього']}</TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
                
                <Card className="bg-background/20">
                    <CardHeader><CardTitle className="text-base">Неуспішні підключення</CardTitle></CardHeader>
                    <CardContent className="!p-2">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="p-1 h-9">
                                        <Select value={filters.connection} onValueChange={(v) => handleFilterChange('connection', v)}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Всі підключення</SelectItem>
                                                {uniqueOptions.connections.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableHead>
                                    <TableHead className="p-1 h-9">
                                        <Select value={filters.login} onValueChange={(v) => handleFilterChange('login', v)}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Всі логіни</SelectItem>
                                                {uniqueOptions.logins.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableHead>
                                    <TableHead className="p-1 h-9">
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
                                <TableRow>
                                    <TableHead>Телефон</TableHead>
                                    <TableHead>Причина</TableHead>
                                    <TableHead>О/р</TableHead>
                                    <TableHead className="text-center">Обр.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {details.map(row => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono">{row.phone}</TableCell>
                                        <TableCell>{row.connection}</TableCell>
                                        <TableCell className="font-mono">{row.account}</TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox checked={!!checkedRows[row.id]} onCheckedChange={() => setCheckedRows(prev => ({...prev, [row.id]: !prev[row.id]}))} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}
