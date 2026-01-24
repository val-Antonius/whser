'use client';

import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: { label: string; href?: string }[];
    backUrl?: string;
    actions?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    breadcrumbs = [],
    backUrl,
    actions
}: PageHeaderProps) {
    return (
        <div className="mb-8 space-y-4">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <div key={crumb.label} className="flex items-center">
                                    <BreadcrumbItem>
                                        {crumb.href && !isLast ? (
                                            <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </div>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}

            {/* Back Button & Title Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {backUrl && (
                        <Button variant="outline" size="icon" asChild className="shrink-0">
                            <Link href={backUrl}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                        {description && (
                            <p className="text-sm text-gray-500 mt-1">{description}</p>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
