
'use client';

import React, { useEffect, useMemo } from 'react';
import type { OutletGroup, ProcessedPopData, ProcessedPrpData, OutletDataMap, ViewMode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn, formatOutletName } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '../ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import PerformanceCard from './performance-card';

type VfViewProps = {
    outlets: string[];
    outletDataMap: OutletDataMap;
    outletGroups: OutletGroup[];
    selectedOutlet: string;
    setSelectedOutlet: (outlet: string) => void;
    onToggleView: (view: ViewMode) => void;
    onBack: () => void;
    isMobile: boolean;
    prpData: ProcessedPopData | null;
    popData: ProcessedPopData | null;
    setShowPrpReport: () => void;
    setShowPopReport: () => void;
};


export default function VfView({
    outlets,
    outletDataMap,
    outletGroups,
    selectedOutlet,
    setSelectedOutlet,
    onToggleView,
    onBack,
    isMobile,
    prpData,
    popData,
    setShowPrpReport,
    setShowPopReport
}: VfViewProps) {
    const [topCarouselApi, setTopCarouselApi] = React.useState<CarouselApi>();
    const [mainCarouselApi, setMainCarouselApi] = React.useState<CarouselApi>();
    const selectedOutletIndex = React.useMemo(() => outlets.indexOf(selectedOutlet), [outlets, selectedOutlet]);
    const selectedOutletGroupIndex = React.useMemo(() => {
        return outletGroups.findIndex(g => g.outlets.includes(selectedOutlet));
    }, [outletGroups, selectedOutlet]);
  
    useEffect(() => {
        if (topCarouselApi && selectedOutletGroupIndex !== -1 && topCarouselApi.selectedScrollSnap() !== selectedOutletGroupIndex) {
            topCarouselApi.scrollTo(selectedOutletGroupIndex);
        }
        if (mainCarouselApi && selectedOutletIndex !== -1 && mainCarouselApi.selectedScrollSnap() !== selectedOutletIndex) {
            mainCarouselApi.scrollTo(selectedOutletIndex);
        }
    }, [selectedOutlet, selectedOutletGroupIndex, selectedOutletIndex, topCarouselApi, mainCarouselApi]);
    
    useEffect(() => {
        if (!mainCarouselApi) return;
        const onSelect = () => {
            const newIndex = mainCarouselApi.selectedScrollSnap();
            if (outlets[newIndex] && outlets[newIndex] !== selectedOutlet) {
                setSelectedOutlet(outlets[newIndex]);
            }
        };
        mainCarouselApi.on('select', onSelect);
        return () => mainCarouselApi.off('select', onSelect);
    }, [mainCarouselApi, outlets, selectedOutlet, setSelectedOutlet]);

    const currentOutletData = outletDataMap.get(selectedOutlet);
    const [city, street] = currentOutletData?.details?.split(', ') || [null, null];
    

    return (
        <div className="w-full max-w-full md:max-w-4xl mx-auto flex flex-col h-auto md:h-auto">
            <div className="flex-shrink-0 pt-2 md:pt-2">
                <div className="flex justify-between items-start mb-4">
                    <div className="text-left">
                        <h2 className="text-xl font-bold">
                        {formatOutletName(selectedOutlet)}
                        </h2>
                        {city && <h3 className="text-sm text-muted-foreground mt-1">{city}</h3>}
                        {street && <h3 className="text-xs text-muted-foreground">{street}</h3>}
                    </div>
                     <div className="flex gap-2">
                        <Button className="conn-hub-style w-[80px] text-xs h-9 !p-2 !rounded-xl" disabled={!prpData} onClick={setShowPrpReport}>PrP</Button>
                        <Button className="conn-hub-style w-[80px] text-xs h-9 !p-2 !rounded-xl" disabled={!popData} onClick={setShowPopReport}>PoP</Button>
                    </div>
                </div>

                <Carousel className="w-full mb-4" setApi={setTopCarouselApi}>
                    <CarouselContent>
                    {outletGroups.map((group, groupIndex) => (
                        <CarouselItem key={groupIndex}>
                            <div className="p-1">
                                <Card className="bg-background/50">
                                    <div className="p-2 rounded-lg">
                                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground truncate">{group.fileName}</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {group.outlets.map(outlet => (
                                        <Button
                                            key={outlet}
                                            onClick={() => setSelectedOutlet(outlet)}
                                            variant={selectedOutlet === outlet ? 'default' : 'secondary'}
                                            size="sm"
                                            className="text-xs h-8"
                                        >
                                            {formatOutletName(outlet)}
                                        </Button>
                                        ))}
                                    </div>
                                    </div>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                </Carousel>
            </div>
            
            <Carousel className="w-full flex-grow" setApi={setMainCarouselApi} opts={{ startIndex: selectedOutletIndex }}>
                <CarouselContent>
                    {outlets.map((outletId) => {
                        const outletPerformanceData = outletDataMap.get(outletId);
                        return (
                            <CarouselItem key={outletId}>
                                <div className={cn(
                                    "grid gap-4 h-full overflow-y-auto pr-2",
                                    "grid-cols-2 md:grid-cols-3"
                                )}>
                                    {outletPerformanceData?.factData
                                        .filter(item => item.category !== 'NBO')
                                        .map((item, index) => (
                                            <PerformanceCard key={index} item={item} />
                                    ))}
                                </div>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                {!isMobile && (
                  <>
                    <CarouselPrevious className="-left-12" />
                    <CarouselNext className="-right-12" />
                  </>
                )}
            </Carousel>
        </div>
    );
}
