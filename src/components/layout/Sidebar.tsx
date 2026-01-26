'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Shirt,
    Package,
    Users,
    Settings,
    X,
    Menu,
    ChevronDown,
    ChevronRight,
    FileText,
    PackagePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [inventoryPlusOpen, setInventoryPlusOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'POS', href: '/admin/pos', icon: ShoppingCart },
        { name: 'Orders', href: '/admin/orders', icon: Shirt },
        { name: 'Tasks', href: '/admin/tasks', icon: FileText },
        { name: 'Service Management', href: '/admin/services', icon: Shirt },
        { name: 'Inventory', href: '/admin/inventory', icon: Package },
        { name: 'Customers', href: '/admin/customers', icon: Users },
    ];

    const reportsMenu = [
        { name: 'Order Aging Report', href: '/admin/reports/aging' },
        { name: 'Inventory Usage', href: '/admin/reports/inventory-usage' },
    ];

    const inventoryPlusMenu = [
        { name: 'Stock Overview', href: '/admin/inventory' },
        { name: 'Consumption Templates', href: '/admin/inventory/consumption' },
        { name: 'Variance Analysis', href: '/admin/inventory/variance' },
        { name: 'Waste Tracking', href: '/admin/inventory/waste' },
        { name: 'Stock Opname (Physical Count)', href: '/admin/inventory/opname' },
    ];

    const NavContent = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <span className="text-blue-400">Whser</span>
                    <span>Laundry</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">Operational System</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    // Match if pathname starts with href, but handle root paths carefully if needed
                    // For /admin/tasks, it matches /admin/tasks/1 etc.
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}

                {/* Reports Dropdown */}
                <div>
                    <button
                        onClick={() => setReportsOpen(!reportsOpen)}
                        className="flex items-center justify-between w-full px-3 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5" />
                            Reports
                        </div>
                        {reportsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {reportsOpen && (
                        <div className="ml-8 mt-1 space-y-1">
                            {reportsMenu.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Inventory+ Dropdown */}
                <div>
                    <button
                        onClick={() => setInventoryPlusOpen(!inventoryPlusOpen)}
                        className="flex items-center justify-between w-full px-3 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <PackagePlus className="h-5 w-5" />
                            Inventory+
                        </div>
                        {inventoryPlusOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {inventoryPlusOpen && (
                        <div className="ml-8 mt-1 space-y-1">
                            {inventoryPlusMenu.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white w-full transition-colors"
                >
                    <Settings className="h-5 w-5" />
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
                    <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r-0 bg-slate-900 text-white">
                    <VisuallyHidden.Root>
                        <SheetTitle>Menu</SheetTitle>
                    </VisuallyHidden.Root>
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden lg:flex flex-col w-64 fixed inset-y-0 z-50", className)}>
                <NavContent />
            </div>
        </>
    );
}
