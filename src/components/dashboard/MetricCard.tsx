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
    colorScheme?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export default function MetricCard({
    title,
    value,
    subtitle,
    trend,
    icon,
    colorScheme = 'blue'
}: MetricCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 text-blue-900',
        green: 'bg-green-50 border-green-200 text-green-900',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        red: 'bg-red-50 border-red-200 text-red-900',
        purple: 'bg-purple-50 border-purple-200 text-purple-900',
    };

    const iconColorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        yellow: 'text-yellow-600',
        red: 'text-red-600',
        purple: 'text-purple-600',
    };

    const getTrendColor = (direction: string) => {
        if (direction === 'up') return 'text-green-600';
        if (direction === 'down') return 'text-red-600';
        return 'text-gray-600';
    };

    const getTrendIcon = (direction: string) => {
        if (direction === 'up') return '↑';
        if (direction === 'down') return '↓';
        return '→';
    };

    return (
        <div className={`rounded-lg border-2 p-6 ${colorClasses[colorScheme]}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
                {icon && <div className={`${iconColorClasses[colorScheme]}`}>{icon}</div>}
            </div>

            <div className="mt-2">
                <p className="text-3xl font-bold">{value}</p>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
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
