// ============================================================================
// INSIGHT CARD COMPONENT
// ============================================================================
// Purpose: Display insight in list view
// Phase: 3.4 - Manual Insight Creation
// ============================================================================

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Info, Pencil, Trash2 } from 'lucide-react';

interface InsightCardProps {
    insight: {
        id: number;
        snapshot_id: number;
        statement: string;
        severity: 'normal' | 'attention' | 'critical';
        metrics_involved: string[];
        is_actionable: boolean;
        created_at: string;
    };
    snapshotName?: string;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
    onClick?: (id: number) => void;
}

const METRIC_LABELS: Record<string, string> = {
    'sla_compliance_rate': 'SLA Compliance',
    'order_aging_critical_pct': 'Order Aging',
    'rewash_rate': 'Rewash Rate',
    'exception_frequency': 'Exception Frequency',
    'contribution_margin': 'Contribution Margin',
    'inventory_variance_avg': 'Inventory Variance',
    'productivity_orders_per_day': 'Productivity',
    'capacity_utilization': 'Capacity Utilization'
};

export function InsightCard({
    insight,
    snapshotName,
    onEdit,
    onDelete,
    onClick
}: InsightCardProps) {
    const getSeverityConfig = () => {
        switch (insight.severity) {
            case 'critical':
                return {
                    icon: <AlertCircle className="h-5 w-5" />,
                    badge: 'bg-red-100 text-red-800',
                    border: 'border-red-300',
                    label: 'KRITIS'
                };
            case 'attention':
                return {
                    icon: <Info className="h-5 w-5" />,
                    badge: 'bg-yellow-100 text-yellow-800',
                    border: 'border-yellow-300',
                    label: 'PERHATIAN'
                };
            default:
                return {
                    icon: <CheckCircle className="h-5 w-5" />,
                    badge: 'bg-green-100 text-green-800',
                    border: 'border-green-300',
                    label: 'NORMAL'
                };
        }
    };

    const config = getSeverityConfig();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${config.border}`}
            onClick={() => onClick?.(insight.id)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className={config.badge}>
                            {config.icon}
                        </div>
                        <Badge className={config.badge}>
                            {config.label}
                        </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                        {formatDate(insight.created_at)}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Snapshot Info */}
                    {snapshotName && (
                        <div className="text-xs text-gray-500">
                            📊 {snapshotName}
                        </div>
                    )}

                    {/* Statement */}
                    <p className="text-gray-900 leading-relaxed">
                        {insight.statement}
                    </p>

                    {/* Metrics Involved */}
                    <div className="flex flex-wrap gap-2">
                        {insight.metrics_involved.map((metric) => (
                            <Badge key={metric} variant="outline" className="text-xs">
                                {METRIC_LABELS[metric] || metric}
                            </Badge>
                        ))}
                    </div>

                    {/* Actionable Indicator */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className={`text-sm ${insight.is_actionable ? 'text-green-600' : 'text-gray-400'}`}>
                            {insight.is_actionable ? '✓ Dapat Ditindaklanjuti' : '✗ Tidak Dapat Ditindaklanjuti'}
                        </span>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(insight.id);
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(insight.id);
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
