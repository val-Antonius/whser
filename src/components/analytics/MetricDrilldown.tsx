// ============================================================================
// METRIC DRILLDOWN MODAL COMPONENT
// ============================================================================
// Purpose: Display detailed metric breakdown with metadata
// Phase: 3.3 - Post-Operational Dashboard UI
// ============================================================================

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface MetricDrilldownProps {
    isOpen: boolean;
    onClose: () => void;
    metric: {
        metric_name: string;
        metric_value: number;
        baseline_value: number | null;
        variance: number | null;
        variance_percentage: number | null;
        significance_level: 'normal' | 'attention' | 'critical';
        metadata?: Record<string, unknown>;
    } | null;
}

const METRIC_LABELS: Record<string, string> = {
    'sla_compliance_rate': 'Tingkat Kepatuhan SLA',
    'order_aging_critical_pct': 'Pesanan Kritis (>72 jam)',
    'rewash_rate': 'Tingkat Rewash',
    'exception_frequency': 'Frekuensi Pengecualian',
    'contribution_margin': 'Margin Kontribusi',
    'inventory_variance_avg': 'Varians Inventori Rata-rata',
    'productivity_orders_per_day': 'Produktivitas (Pesanan/Hari)',
    'capacity_utilization': 'Utilisasi Kapasitas'
};

export function MetricDrilldown({ isOpen, onClose, metric }: MetricDrilldownProps) {
    if (!metric) return null;

    // Convert to numbers to handle API string responses
    const numericValue = Number(metric.metric_value);
    const numericBaseline = metric.baseline_value !== null ? Number(metric.baseline_value) : null;
    const numericVariance = metric.variance !== null ? Number(metric.variance) : null;
    const numericVariancePercentage = metric.variance_percentage !== null ? Number(metric.variance_percentage) : null;

    const renderMetadata = (data: Record<string, unknown>) => {
        return Object.entries(data).map(([key, value]) => {
            // Format key to be more readable
            const formattedKey = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());

            // Handle different value types
            let displayValue: React.ReactNode;

            if (typeof value === 'object' && value !== null) {
                displayValue = (
                    <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                    </pre>
                );
            } else if (typeof value === 'number') {
                displayValue = <span className="font-mono">{value.toLocaleString('id-ID')}</span>;
            } else {
                displayValue = <span>{String(value)}</span>;
            }

            return (
                <div key={key} className="py-2 border-b border-gray-100 last:border-0">
                    <dt className="text-sm font-medium text-gray-600">{formattedKey}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{displayValue}</dd>
                </div>
            );
        });
    };

    const getSignificanceBadge = () => {
        const styles = {
            normal: 'bg-green-100 text-green-800',
            attention: 'bg-yellow-100 text-yellow-800',
            critical: 'bg-red-100 text-red-800'
        };

        const labels = {
            normal: 'Normal',
            attention: 'Perhatian',
            critical: 'Kritis'
        };

        return (
            <Badge className={styles[metric.significance_level]}>
                {labels[metric.significance_level]}
            </Badge>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{METRIC_LABELS[metric.metric_name] || metric.metric_name}</span>
                        {getSignificanceBadge()}
                    </DialogTitle>
                    <DialogDescription>
                        Detail lengkap metrik dan data pendukung
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm text-blue-600 font-medium">Nilai Saat Ini</div>
                            <div className="text-2xl font-bold text-blue-900 mt-1">
                                {numericValue.toFixed(2)}%
                            </div>
                        </div>

                        {numericBaseline !== null && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 font-medium">Baseline</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">
                                    {numericBaseline.toFixed(2)}%
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Variance */}
                    {numericVariance !== null && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-purple-600 font-medium">Varians</div>
                                    <div className="text-xl font-bold text-purple-900 mt-1">
                                        {numericVariance > 0 ? '+' : ''}{numericVariance.toFixed(2)}
                                    </div>
                                </div>
                                {numericVariancePercentage !== null && (
                                    <div className="text-right">
                                        <div className="text-sm text-purple-600 font-medium">Persentase</div>
                                        <div className="text-xl font-bold text-purple-900 mt-1">
                                            {numericVariancePercentage > 0 ? '+' : ''}{numericVariancePercentage.toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    {metric.metadata && Object.keys(metric.metadata).length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Data Pendukung
                            </h3>
                            <dl className="divide-y divide-gray-100 border border-gray-200 rounded-lg p-4">
                                {renderMetadata(metric.metadata)}
                            </dl>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
