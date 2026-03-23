'use client';

import React from 'react';
import { ArrowLeft, BarChart3, Settings, Package, FileText, LayoutGrid } from 'lucide-react';
import { type MarketSubView } from '@/components/layout/sales-analytics';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';

type SalesSidebarProps = {
    currentView: MarketSubView;
    setView: (view: MarketSubView) => void;
    onBack: () => void;
    onMenuBack: () => void;
};

export default function SalesSidebar({ currentView, setView, onBack, onMenuBack }: SalesSidebarProps) {
    const navItems: { view: MarketSubView, label: string, icon: React.ElementType }[] = [
        { view: 'sales', label: 'Продажі', icon: BarChart3 },
        { view: 'remains', label: 'Залишки', icon: Package },
        { view: 'reports', label: 'Звіти', icon: FileText },
        { view: 'settings', label: 'Налаштування', icon: Settings },
    ];

    return (
        <>
            <SidebarHeader>
                 <div className="p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={onMenuBack} className="justify-start">
                                <LayoutGrid />
                                <span className="group-data-[collapsible=icon]:hidden">Меню Маркету</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                 </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map(item => (
                        <SidebarMenuItem key={item.view}>
                            <SidebarMenuButton
                                onClick={() => setView(item.view)} 
                                isActive={currentView === item.view}
                                className="justify-start"
                            >
                                <item.icon />
                                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={onBack} className="justify-start">
                            <ArrowLeft /> 
                            <span className="group-data-[collapsible=icon]:hidden">Головне меню</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </>
    );
}
