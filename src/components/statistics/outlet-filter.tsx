'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatOutletName } from '@/lib/utils';
import type { OutletData } from '@/lib/types';

type OutletFilterProps = {
  outlets: string[];
  selectedOutlets: string[];
  onToggle: (outlet: string) => void;
  title: string;
};

export default function OutletFilter({ outlets, selectedOutlets, onToggle, title }: OutletFilterProps) {
    return (
        <Card className="bg-transparent border-none shadow-none mt-4 flex-grow flex flex-col">
            <CardHeader className="flex-shrink-0 p-0 mb-4">
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0">
                <div className="flex flex-wrap gap-2">
                    {outlets.map(outlet => (
                        <Button key={outlet} onClick={() => onToggle(outlet)} variant={selectedOutlets.includes(outlet) ? 'default' : 'secondary'} size="sm" className="h-8 justify-start text-left">
                            {formatOutletName(outlet)}
                        </Button>
                    ))}
                </div>
            </CardContent>
            {selectedOutlets.length > 0 && 
              <CardFooter className="pt-4 p-0 flex-shrink-0">
                <Button variant="destructive" size="sm" onClick={() => onToggle('__RESET__')} className="w-full">Скинути</Button>
              </CardFooter>
            }
        </Card>
    )
}
