'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Shirt,
    Package,
    Users,
    Settings,
    Menu,
    ChevronDown,
    ChevronRight,
    FileText,
    BarChart3,
    Sparkles,
    ClipboardList,
    Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface SidebarProps {
    className?: string;
}

type NavItem = {
    title: string;
    icon: any;
    href?: string;
    children?: { title: string; href: string }[];
};

const NAV_ITEMS: NavItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'POS', href: '/admin/pos', icon: ShoppingCart },
    { title: 'Orders', href: '/admin/orders', icon: Shirt },
    { title: 'Tasks', href: '/admin/tasks', icon: ClipboardList },
    {
        title: 'Inventory',
        icon: Package,
        children: [
            { title: 'Stock Overview', href: '/admin/inventory' },
            { title: 'Consumption Templates', href: '/admin/inventory/consumption' },
            { title: 'Variance Analysis', href: '/admin/inventory/variance' },
            { title: 'Waste Tracking', href: '/admin/inventory/waste' },
            { title: 'Stock Opname', href: '/admin/inventory/opname' },
        ]
    },
    { title: 'Customers', href: '/admin/customers', icon: Users },
    {
        title: 'Reports',
        icon: BarChart3,
        children: [
            { title: 'Order Aging', href: '/admin/reports/aging' },
            { title: 'Inventory Usage', href: '/admin/reports/inventory-usage' },
        ]
    },
    { title: 'Service Mgmt', href: '/admin/services', icon: Box },
];

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Track expanded state for groups
    // Initialize with groups that should be open based on current path
    const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
        const initialOpen: string[] = [];
        NAV_ITEMS.forEach(item => {
            if (item.children) {
                const hasActiveChild = item.children.some(child => pathname.startsWith(child.href));
                if (hasActiveChild) initialOpen.push(item.title);
            }
        });
        return initialOpen;
    });

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    const NavContent = () => (
        <div className="flex flex-col h-full bg-white text-slate-600 border-r border-slate-200 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span>Whser</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1 pl-10 font-medium tracking-wide">OPERATIONAL SYSTEM</p>
            </div>

            {/* Scrollable Nav - Hidden Scrollbar Style */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
                {NAV_ITEMS.map((item) => {
                    if (item.children) {
                        const isExpanded = expandedGroups.includes(item.title);
                        const isActiveGroup = item.children.some(child => pathname.startsWith(child.href));

                        return (
                            <div key={item.title} className="mb-2">
                                <button
                                    onClick={() => toggleGroup(item.title)}
                                    className={cn(
                                        "flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                                        isActiveGroup
                                            ? "text-sky-700 bg-sky-50"
                                            : "text-slate-600 hover:text-sky-600 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={cn(
                                            "h-5 w-5 transition-colors",
                                            isActiveGroup ? "text-sky-600" : "text-slate-400 group-hover:text-sky-500"
                                        )} />
                                        {item.title}
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                    )}
                                </button>

                                <div className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out pl-4 space-y-1 mt-1 border-l border-slate-100 ml-5",
                                    isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    {item.children.map((child) => {
                                        const isChildActive = pathname === child.href;
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "block px-3 py-2 text-sm rounded-md transition-colors relative",
                                                    isChildActive
                                                        ? "text-sky-700 bg-sky-50 font-medium"
                                                        : "text-slate-500 hover:text-sky-600 hover:bg-slate-50"
                                                )}
                                            >
                                                {child.title}
                                                {isChildActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-[17px] w-1 h-6 bg-sky-500 rounded-r-full" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    // Leaf Item
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));

                    return (
                        <Link
                            key={item.title}
                            href={item.href!}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative group mb-1",
                                isActive
                                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-sky-600"
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 transition-colors",
                                isActive ? "text-white" : "text-slate-400 group-hover:text-sky-500"
                            )} />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-white rounded-md w-full transition-all shadow-sm hover:shadow group"
                >
                    <Settings className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                    Pengaturan
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50 text-slate-800 bg-white shadow-sm border border-slate-200 hover:bg-slate-50">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r-0 bg-white text-slate-900">

                    <VisuallyHidden.Root>
                        <SheetTitle>Menu</SheetTitle>
                    </VisuallyHidden.Root>
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden lg:flex flex-col w-64 fixed inset-y-0 z-50 shadow-xl", className)}>
                <NavContent />
            </div>

            {/* Spacer for main content to offset fixed sidebar */}
            {/* <div className="hidden lg:block w-64 flex-shrink-0" /> */}
        </>
    );
}
