// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================
// Purpose: Display individual metric with variance and significance
// Phase: 3.3 - Post-Operational Dashboard UI
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MetricCardProps {
    metricName: string;
    metricValue: number;
    baselineValue: number | null;
    variance: number | null;
    variancePercentage: number | null;
    significanceLevel: 'normal' | 'attention' | 'critical';
    unit?: string;
    onClick?: () => void;
}

const METRIC_LABELS: Record<string, string> = {
    'sla_compliance_rate': 'Tingkat Kepatuhan SLA',
    'order_aging_critical_pct': 'Pesanan Kritis (>72j)',
    'rewash_rate': 'Tingkat Rewash',
    'exception_frequency': 'Frekuensi Pengecualian',
    'contribution_margin': 'Margin Kontribusi',
    'inventory_variance_avg': 'Varians Inventori',
    'productivity_orders_per_day': 'Produktivitas',
    'capacity_utilization': 'Utilisasi Kapasitas'
};

export function MetricCard({
    metricName,
    metricValue,
    baselineValue,
    variance,
    variancePercentage,
    significanceLevel,
    unit = '%',
    onClick
}: MetricCardProps) {
    // Convert to numbers to handle API string responses
    const numericValue = Number(metricValue);
    const numericBaseline = baselineValue !== null ? Number(baselineValue) : null;
    const numericVariance = variance !== null ? Number(variance) : null;
    const numericVariancePercentage = variancePercentage !== null ? Number(variancePercentage) : null;

    // Determine trend direction
    const getTrendIcon = () => {
        if (numericVariance === null || numericVariance === 0) return <Minus className="h-4 w-4 text-gray-500" />;

        // For metrics where higher is better
        const higherIsBetter = [
            'sla_compliance_rate',
            'productivity_orders_per_day',
            'contribution_margin',
            'capacity_utilization'
        ].includes(metricName);

        // For metrics where lower is better
        const lowerIsBetter = [
            'rewash_rate',
            'exception_frequency',
            'order_aging_critical_pct',
            'inventory_variance_avg'
        ].includes(metricName);

        if (higherIsBetter) {
            return numericVariance > 0
                ? <ArrowUp className="h-4 w-4 text-green-600" />
                : <ArrowDown className="h-4 w-4 text-red-600" />;
        } else if (lowerIsBetter) {
            return numericVariance < 0
                ? <ArrowUp className="h-4 w-4 text-green-600" />
                : <ArrowDown className="h-4 w-4 text-red-600" />;
        }

        return <Minus className="h-4 w-4 text-gray-500" />;
    };

    // Significance badge styling
    const getSignificanceBadge = () => {
        const styles = {
            normal: 'bg-green-100 text-green-800 hover:bg-green-200',
            attention: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
            critical: 'bg-red-100 text-red-800 hover:bg-red-200'
        };

        const labels = {
            normal: 'Normal',
            attention: 'Perhatian',
            critical: 'Kritis'
        };

        return (
            <Badge className={styles[significanceLevel]}>
                {labels[significanceLevel]}
            </Badge>
        );
    };

    return (
        <Card
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white/90 backdrop-blur border-none ring-1 ring-inset ${significanceLevel === 'critical' ? 'ring-red-200/50 shadow-red-100' :
                significanceLevel === 'attention' ? 'ring-yellow-200/50 shadow-yellow-100' :
                    'ring-indigo-50 shadow-indigo-100/50'
                }`}
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        {METRIC_LABELS[metricName] || metricName}
                    </CardTitle>
                    {getTrendIcon()}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Main Value */}
                    <div className="text-3xl font-bold text-indigo-950 tracking-tight">
                        {numericValue.toFixed(1)}{unit}
                    </div>

                    {/* Baseline and Variance */}
                    {numericBaseline !== null && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                                Baseline: {numericBaseline.toFixed(1)}{unit}
                            </span>
                            {numericVariancePercentage !== null && (
                                <span className={`font-medium ${numericVariancePercentage > 0 ? 'text-blue-600' : 'text-orange-600'
                                    }`}>
                                    {numericVariancePercentage > 0 ? '+' : ''}{numericVariancePercentage.toFixed(1)}%
                                </span>
                            )}
                        </div>
                    )}

                    {/* Significance Badge */}
                    <div className="flex items-center justify-between">
                        {getSignificanceBadge()}
                        <span className="text-xs text-gray-400">
                            Klik untuk detail
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
