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
    Menu
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

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard/operations', icon: LayoutDashboard },
        { name: 'Kasir', href: '/admin/pos', icon: ShoppingCart },
        { name: 'Layanan', href: '/admin/services', icon: Shirt },
        { name: 'Inventori', href: '/admin/inventory', icon: Package },
        { name: 'Pelanggan', href: '/admin/customers', icon: Users },
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

            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
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
