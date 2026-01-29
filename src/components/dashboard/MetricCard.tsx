'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        direction: 'up' | 'down' | 'neutral';
        value: string;
    };
    icon?: ReactNode;
    info?: string;
    colorScheme?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export default function MetricCard({
    title,
    value,
    subtitle,
    trend,
    icon,
    info,
    colorScheme = 'blue'
}: MetricCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50/50 border-blue-100 text-blue-900',
        green: 'bg-green-50/50 border-green-100 text-green-900',
        yellow: 'bg-amber-50/50 border-amber-100 text-amber-900',
        red: 'bg-red-50/50 border-red-100 text-red-900',
        purple: 'bg-violet-50/50 border-violet-100 text-violet-900',
    };

    const iconColorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        yellow: 'text-amber-600',
        red: 'text-red-600',
        purple: 'text-violet-600',
    };

    const getTrendColor = (direction: string) => {
        if (direction === 'up') return 'text-emerald-600';
        if (direction === 'down') return 'text-rose-600';
        return 'text-slate-600';
    };

    const getTrendIcon = (direction: string) => {
        if (direction === 'up') return '↑';
        if (direction === 'down') return '↓';
        return '→';
    };

    return (
        <div className={`rounded-xl border backdrop-blur-sm p-6 ${colorClasses[colorScheme]} relative group/card transition-all duration-300 hover:shadow-lg hover:bg-opacity-80`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wide">{title}</h3>
                    {info && (
                        <div className="relative group/info">
                            <span className="cursor-help text-xs bg-white/50 text-slate-500 rounded-full w-4 h-4 flex items-center justify-center border border-slate-200">i</span>
                            <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-10 backdrop-blur-md">
                                {info}
                                {/* Arrow */}
                                <div className="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                        </div>
                    )}
                </div>
                {icon && <div className={`${iconColorClasses[colorScheme]}`}>{icon}</div>}
            </div>

            <div className="mt-2">
                <p className="text-3xl font-light text-slate-900">{value}</p>
                {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
            </div>

            {trend && (
                <div className={`mt-3 flex items-center text-sm font-medium ${getTrendColor(trend.direction)}`}>
                    <span className="mr-1">{getTrendIcon(trend.direction)}</span>
                    <span>{trend.value}</span>
                </div>
            )}
        </div>
    );
}
