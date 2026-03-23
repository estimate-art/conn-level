'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const WarningSection = ({ title, items, onNavigate, type }: { title: string, items: string[], onNavigate: (type: any) => void, type: 'categories' | 'sellers' | 'departments' }) => {
    if (items.length === 0) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{title} <span className="text-sm text-muted-foreground">({items.length})</span></h3>
                <Button variant="ghost" size="sm" onClick={() => onNavigate(type)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Виправити
                </Button>
            </div>
            <ScrollArea className="h-24 rounded-md border p-2 bg-muted/50">
                <div className="space-y-1">
                    {items.map((item, index) => (
                        <div key={index} className="text-xs p-1 truncate" title={item}>
                           - {item}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};


export const WarningsDialog = ({ open, onOpenChange, unmappedItems, openMappingDialog, showAttentionColumn, setShowAttentionColumn }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unmappedItems: { categories: string[], sellers: string[], departments: string[] };
    openMappingDialog: (type: 'categories' | 'sellers' | 'departments') => void;
    showAttentionColumn: boolean;
    setShowAttentionColumn: (show: boolean) => void;
}) => {
    const handleNavigate = (type: 'categories' | 'sellers' | 'departments') => {
        onOpenChange(false);
        // A short delay to allow the first dialog to close before opening the next
        setTimeout(() => openMappingDialog(type), 150); 
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="conn-hub-style !p-6 !bg-gradient-to-br from-[--glass-blue-top] to-[--glass-blue-bottom] !border-white/20">
                <DialogHeader>
                    <DialogTitle>Елементи, що потребують уваги</DialogTitle>
                    <DialogDescription>
                        Система не впевнена в наступних даних. Створіть правила для автоматизації.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-2 border-b border-t border-white/10">
                    <Switch id="attention-mode" checked={showAttentionColumn} onCheckedChange={setShowAttentionColumn} />
                    <Label htmlFor="attention-mode">Показувати стовпець "Увага"</Label>
                </div>
                <div className="space-y-4 pt-4">
                   <WarningSection 
                        title="Нерозподілені товари"
                        items={unmappedItems.categories}
                        onNavigate={handleNavigate}
                        type="categories"
                   />
                   <WarningSection 
                        title="Невпізнані продавці"
                        items={unmappedItems.sellers}
                        onNavigate={handleNavigate}
                        type="sellers"
                   />
                   <WarningSection 
                        title="Невпізнані відділи"
                        items={unmappedItems.departments}
                        onNavigate={handleNavigate}
                        type="departments"
                   />
                </div>
            </DialogContent>
        </Dialog>
    );
};
