'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag, Trash2, Edit, X } from 'lucide-react';
import type { SalesConfig, CategoryRule, DepartmentConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

type MappingDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'categories' | 'sellers' | 'departments';
    config: SalesConfig;
    onConfigChange: (newConfig: SalesConfig) => void;
    unmappedItems: { categories: string[], sellers: string[], departments: string[] };
};

const typeTitles = {
    categories: 'Зіставлення Категорій',
    sellers: 'Зіставлення Продавців',
    departments: 'Зіставлення Відділів'
};

const EditCategoryDialog = ({ rule, open, onOpenChange, onSave, onDelete }: { rule: CategoryRule | null, open: boolean, onOpenChange: (open: boolean) => void, onSave: (rule: CategoryRule) => void, onDelete: (ruleId: string) => void }) => {
    const [editedRule, setEditedRule] = useState<CategoryRule | null>(null);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (rule) {
            setEditedRule(JSON.parse(JSON.stringify(rule)));
        } else {
            setEditedRule({ id: `cat_${Date.now()}`, label: '', priority: 0, tags: [] });
        }
    }, [rule]);

    if (!open || !editedRule) return null;

    const handleSave = () => {
        if (editedRule.label.trim()) {
            onSave(editedRule);
        }
    };

    const addTag = () => {
        if (tagInput && !editedRule.tags.includes(tagInput)) {
            setEditedRule({ ...editedRule, tags: [...editedRule.tags, tagInput] });
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setEditedRule({ ...editedRule, tags: editedRule.tags.filter(tag => tag !== tagToRemove) });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{rule ? 'Редагувати правило' : 'Створити нову категорію'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="label" className="text-right">Мітка</Label>
                        <Input id="label" value={editedRule.label} onChange={(e) => setEditedRule({ ...editedRule, label: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="priority" className="text-right">Пріоритет</Label>
                        <Input id="priority" type="number" value={editedRule.priority} onChange={(e) => setEditedRule({ ...editedRule, priority: parseInt(e.target.value, 10) || 0 })} className="col-span-3" />
                    </div>
                    <div>
                        <Label>Теги</Label>
                        <div className="flex gap-2 mt-2">
                            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Додати новий тег..." onKeyDown={(e) => e.key === 'Enter' && addTag()} />
                            <Button onClick={addTag}>Додати</Button>
                        </div>
                        <ScrollArea className="h-32 mt-2 rounded-md border">
                            <div className="p-2 space-y-1">
                                {editedRule.tags.map((tag, i) => (
                                    <div key={i} className="flex justify-between items-center bg-secondary p-1 rounded-md">
                                        <span className="text-sm ml-2">{tag}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTag(tag)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    {rule && <Button variant="destructive" onClick={() => onDelete(editedRule.id)}>Видалити</Button>}
                    <div className="flex-grow"></div>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Скасувати</Button>
                    <Button onClick={handleSave}>Зберегти</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const EditSellerDialog = ({ seller, onSave, onCancel, onDelete }: { seller: { alias: string, name: string } | null, onSave: (data: { alias: string, name: string }) => void, onCancel: () => void, onDelete?: (alias: string) => void }) => {
    const [alias, setAlias] = useState(seller?.alias || '');
    const [name, setName] = useState(seller?.name || '');
    const isEditing = !!seller;
    
    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader><DialogTitle>{isEditing ? 'Редагувати продавця' : 'Новий продавець'}</DialogTitle></DialogHeader>
                <div className="space-y-2 py-4">
                    <Label>Псевдонім (ключ пошуку)</Label>
                    <Input value={alias} onChange={e => setAlias(e.target.value)} readOnly={isEditing && !!seller?.alias} />
                    <Label>Повне ім'я</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <DialogFooter>
                    {isEditing && onDelete && <Button variant="destructive" onClick={() => onDelete(alias)}>Видалити</Button>}
                    <div className="flex-grow"></div>
                    <Button variant="outline" onClick={onCancel}>Скасувати</Button>
                    <Button onClick={() => onSave({ alias, name })}>Зберегти</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const EditDepartmentDialog = ({ department, onSave, onCancel, onDelete }: { department: DepartmentConfig | null, onSave: (data: DepartmentConfig) => void, onCancel: () => void, onDelete?: (key: string) => void }) => {
    const [key, setKey] = useState(department?.key || '');
    const [label, setLabel] = useState(department?.label || '');
    const isEditing = !!department;
    
    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader><DialogTitle>{isEditing ? 'Редагувати відділ' : 'Новий відділ'}</DialogTitle></DialogHeader>
                <div className="space-y-2 py-4">
                    <Label>Ключ пошуку (напр. FORA)</Label>
                    <Input value={key} onChange={e => setKey(e.target.value)} readOnly={isEditing && !!department?.key} />
                    <Label>Назва відділу (напр. Фора)</Label>
                    <Input value={label} onChange={e => setLabel(e.target.value)} />
                </div>
                <DialogFooter>
                    {isEditing && onDelete && <Button variant="destructive" onClick={() => onDelete(key)}>Видалити</Button>}
                    <div className="flex-grow"></div>
                    <Button variant="outline" onClick={onCancel}>Скасувати</Button>
                    <Button onClick={() => onSave({ key, label })}>Зберегти</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const UnifiedRenderer = ({ onOpenNew, onOpenEdit, existingRules, unmappedItems, itemKey, itemValue, searchTerm, setSearchTerm }: any) => {
    return (
        <div className="grid grid-cols-2 gap-4 flex-grow min-h-0 py-4">
            <div className="flex flex-col gap-2 rounded-lg border p-2">
                <div className="flex justify-between items-center px-2 flex-shrink-0">
                    <h4 className="font-semibold text-sm">Існуючі правила</h4>
                    <Button size="sm" onClick={() => onOpenNew(null)}>Нове</Button>
                </div>
                <ScrollArea className="flex-grow h-0">
                    <div className="space-y-1 p-1">
                        {existingRules.map((rule: any) => (
                            <div key={itemKey(rule)} className="flex items-center">
                                <div className="w-full justify-start text-left p-2">
                                    {itemValue(rule)}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onOpenEdit(rule)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border p-2">
                <h4 className="font-semibold text-sm px-2 flex-shrink-0">Нерозподілені елементи</h4>
                <div className="relative p-2 flex-shrink-0">
                    <Input placeholder="Пошук..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-8"/>
                    {searchTerm && <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></Button>}
                </div>
                <ScrollArea className="flex-grow h-0">
                    <div className="space-y-1 p-2">
                        {unmappedItems.map((item: string, index: number) => (
                            <div key={index} className="text-xs p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => onOpenNew(item)}>
                                {item}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
};


export default function MappingDialog({ open, onOpenChange, type, config, onConfigChange, unmappedItems }: MappingDialogProps) {
    const [localConfig, setLocalConfig] = useState<SalesConfig>(config);
    const [searchTerm, setSearchTerm] = useState('');
    const [localUnmapped, setLocalUnmapped] = useState(unmappedItems);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

    const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState<CategoryRule | null>(null);
    
    // States for sellers/departments
    const [isEditSellerOpen, setIsEditSellerOpen] = useState(false);
    const [sellerToEdit, setSellerToEdit] = useState<{ alias: string, name: string } | null>(null);

    const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
    const [deptToEdit, setDeptToEdit] = useState<DepartmentConfig | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    useEffect(() => {
        setLocalUnmapped(unmappedItems);
    }, [unmappedItems]);


    const itemsToDisplay = useMemo(() => {
        const list = localUnmapped[type] || [];
        if (!searchTerm) return list;
        return list.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [localUnmapped, type, searchTerm]);


    // --- Categories Logic ---

    const handleSelectRule = (id: string) => {
        setSelectedRuleId(id === selectedRuleId ? null : id);
    };

    const handleSaveTag = () => {
        if (!searchTerm.trim() || !selectedRuleId) {
            toast({
                variant: 'destructive',
                title: 'Не виконано умову',
                description: 'Введіть тег у поле пошуку та оберіть правило зліва.',
            });
            return;
        }

        const newConfig = JSON.parse(JSON.stringify(localConfig));
        const rule = newConfig.rules.find((r: CategoryRule) => r.id === selectedRuleId);

        if (rule && !rule.tags.includes(searchTerm.trim())) {
            rule.tags.push(searchTerm.trim());
            
            toast({ title: `Тег "${searchTerm.trim()}" додано до "${rule.label}"` });

            const newTag = searchTerm.trim().toLowerCase();
            const updatedUnmapped = localUnmapped.categories.filter(item => !item.toLowerCase().includes(newTag));
            
            setLocalConfig(newConfig);
            onConfigChange(newConfig);
            setLocalUnmapped(prev => ({
                ...prev,
                categories: updatedUnmapped
            }));

            setSearchTerm('');
        }
    };

    const handleOpenEditCategory = (rule: CategoryRule | null) => {
        setRuleToEdit(rule);
        setIsEditCategoryOpen(true);
    };

    const handleSaveCategory = (updatedRule: CategoryRule) => {
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        if (!newConfig.rules) newConfig.rules = [];
        const ruleIndex = newConfig.rules.findIndex((r: CategoryRule) => r.id === updatedRule.id);

        if (ruleIndex > -1) {
            newConfig.rules[ruleIndex] = updatedRule;
            toast({ title: "Правило оновлено" });
        } else {
            newConfig.rules.push(updatedRule);
            toast({ title: "Нову категорію створено" });
        }
        
        setLocalConfig(newConfig);
        onConfigChange(newConfig);
        setIsEditCategoryOpen(false);
        setRuleToEdit(null);
    };

    const handleDeleteCategory = (ruleId: string) => {
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        newConfig.rules = newConfig.rules.filter((r: CategoryRule) => r.id !== ruleId);
        setLocalConfig(newConfig);
        onConfigChange(newConfig);
        toast({ title: "Правило видалено", variant: "destructive" });
        setIsEditCategoryOpen(false);
        setRuleToEdit(null);
    }
    
    // --- Generic Handlers ---
    const handleSaveSeller = (data: { alias: string, name: string }) => {
        if (!data.alias.trim() || !data.name.trim()) return;
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        const newAlias = data.alias.trim().toLowerCase();
        newConfig.sellers[newAlias] = data.name.trim();
        setLocalConfig(newConfig);
        onConfigChange(newConfig);
        setLocalUnmapped(prev => ({ ...prev, sellers: prev.sellers.filter(s => s !== data.alias) }));
        toast({ title: `Правило для продавця "${data.name}" збережено.` });
        setIsEditSellerOpen(false);
        setSellerToEdit(null);
    };

    const handleDeleteSeller = (alias: string) => {
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        delete newConfig.sellers[alias.toLowerCase()];
        setLocalConfig(newConfig);
        onConfigChange(newConfig);
        toast({ title: "Продавця видалено", variant: "destructive" });
        setIsEditSellerOpen(false);
        setSellerToEdit(null);
    };

    const handleSaveDepartment = (data: DepartmentConfig) => {
        if (!data.key.trim() || !data.label.trim()) return;
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        const newKey = data.key.trim().toUpperCase();
        const existingIndex = newConfig.departments.findIndex((d: DepartmentConfig) => d.key === newKey);
        if (existingIndex > -1) {
            newConfig.departments[existingIndex] = { key: newKey, label: data.label.trim() };
        } else {
            newConfig.departments.push({ key: newKey, label: data.label.trim() });
        }
        setLocalConfig(newConfig);
        onConfigChange(newConfig);
        setLocalUnmapped(prev => ({ ...prev, departments: prev.departments.filter(d => d !== data.key)}));
        toast({ title: `Правило для відділу "${data.label}" збережено.` });
        setIsEditDeptOpen(false);
        setDeptToEdit(null);
    };

    const handleDeleteDepartment = (key: string) => {
        const newConfig = JSON.parse(JSON.stringify(localConfig));
        newConfig.departments = newConfig.departments.filter((d: DepartmentConfig) => d.key !== key);
        setLocalConfig(newConfig);
        onConfigChange(newConfig);
        toast({ title: "Відділ видалено", variant: "destructive" });
        setIsEditDeptOpen(false);
        setDeptToEdit(null);
    };

    // --- Render Functions ---
    const renderCategories = () => (
        <>
            <EditCategoryDialog
                rule={ruleToEdit}
                open={isEditCategoryOpen}
                onOpenChange={setIsEditCategoryOpen}
                onSave={handleSaveCategory}
                onDelete={handleDeleteCategory}
            />
            <div className="flex items-center gap-2 py-4">
                <div className="relative flex-grow">
                    <Input
                        placeholder="Пошук по нерозподілених або новий тег..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pr-8"
                    />
                    {searchTerm && (
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Button variant="outline" size="icon" title="Прив'язати тег до правила" onClick={handleSaveTag}>
                    <Tag className="h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="flex flex-col gap-2 rounded-lg border p-2">
                    <div className="flex justify-between items-center px-2 flex-shrink-0">
                        <h4 className="font-semibold text-sm">Існуючі правила категорій</h4>
                        <Button size="sm" onClick={() => handleOpenEditCategory(null)}>Нова</Button>
                    </div>
                     <ScrollArea className="flex-grow h-0">
                        <div className="space-y-1 p-1">
                            {(localConfig.rules || []).map(rule => (
                                <div key={rule.id} className="flex items-center">
                                    <Button
                                        variant={selectedRuleId === rule.id ? 'default' : 'ghost'}
                                        onClick={() => handleSelectRule(rule.id)}
                                        className="w-full justify-start text-left"
                                    >
                                        {rule.label}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleOpenEditCategory(rule)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <div className="flex flex-col gap-2 rounded-lg border p-2">
                    <h4 className="font-semibold text-sm px-2 flex-shrink-0">Нерозподілені товари</h4>
                    <ScrollArea className="flex-grow h-0">
                        <div className="space-y-1 p-2">
                            {itemsToDisplay.map((item, index) => (
                                <div key={index} className="text-xs p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer truncate" onClick={() => setSearchTerm(item)}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </>
    );

    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{typeTitles[type]}</DialogTitle>
                    <DialogDescription>
                        Знайдіть закономірності у нерозподілених даних, щоб створити нові правила класифікації.
                    </DialogDescription>
                </DialogHeader>

                {isEditSellerOpen && <EditSellerDialog seller={sellerToEdit} onCancel={() => setIsEditSellerOpen(false)} onSave={handleSaveSeller} onDelete={handleDeleteSeller} />}
                {isEditDeptOpen && <EditDepartmentDialog department={deptToEdit} onCancel={() => setIsEditDeptOpen(false)} onSave={handleSaveDepartment} onDelete={handleDeleteDepartment} />}

                {type === 'categories' && renderCategories()}
                
                {type === 'sellers' && (
                    <UnifiedRenderer
                        onOpenNew={(item: string | null) => { setSellerToEdit(item ? { alias: item, name: '' } : null); setIsEditSellerOpen(true); }}
                        onOpenEdit={(rule: { key: string, value: string }) => { setSellerToEdit({ alias: rule.key, name: rule.value }); setIsEditSellerOpen(true); }}
                        existingRules={Object.entries(localConfig.sellers).map(([key, value]) => ({ key, value }))}
                        unmappedItems={itemsToDisplay}
                        itemKey={(rule: any) => rule.key}
                        itemValue={(rule: any) => <span><span className="font-semibold">{rule.key}</span> → {rule.value}</span>}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                )}
                
                {type === 'departments' && (
                    <UnifiedRenderer
                        onOpenNew={(item: string | null) => { setDeptToEdit(item ? { key: item, label: '' } : null); setIsEditDeptOpen(true); }}
                        onOpenEdit={(rule: DepartmentConfig) => { setDeptToEdit(rule); setIsEditDeptOpen(true); }}
                        existingRules={localConfig.departments || []}
                        unmappedItems={itemsToDisplay}
                        itemKey={(rule: any) => rule.key}
                        itemValue={(rule: any) => <span><span className="font-semibold">{rule.key}</span> → {rule.label}</span>}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                )}

                <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Закрити</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
