// ============================================================================
// INSIGHT FORM COMPONENT
// ============================================================================
// Purpose: Form for creating and editing insights
// Phase: 3.4 - Manual Insight Creation
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface InsightFormProps {
    snapshots: Array<{
        id: number;
        snapshot_name: string;
        period_start: string;
        period_end: string;
    }>;
    initialData?: {
        snapshot_id: number;
        statement: string;
        severity: 'normal' | 'attention' | 'critical';
        metrics_involved: string[];
        is_actionable: boolean;
    };
    onSubmit: (data: {
        snapshot_id: number;
        statement: string;
        severity: 'normal' | 'attention' | 'critical';
        metrics_involved: string[];
        is_actionable: boolean;
    }) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const AVAILABLE_METRICS = [
    { id: 'sla_compliance_rate', label: 'Tingkat Kepatuhan SLA' },
    { id: 'order_aging_critical_pct', label: 'Pesanan Kritis (>72 jam)' },
    { id: 'rewash_rate', label: 'Tingkat Rewash' },
    { id: 'exception_frequency', label: 'Frekuensi Pengecualian' },
    { id: 'contribution_margin', label: 'Margin Kontribusi' },
    { id: 'inventory_variance_avg', label: 'Varians Inventori' },
    { id: 'productivity_orders_per_day', label: 'Produktivitas' },
    { id: 'capacity_utilization', label: 'Utilisasi Kapasitas' }
];

export function InsightForm({
    snapshots,
    initialData,
    onSubmit,
    onCancel,
    isLoading = false
}: InsightFormProps) {
    const [snapshotId, setSnapshotId] = useState<number | null>(
        initialData?.snapshot_id || null
    );
    const [statement, setStatement] = useState(initialData?.statement || '');
    const [severity, setSeverity] = useState<'normal' | 'attention' | 'critical'>(
        initialData?.severity || 'normal'
    );
    const [metricsInvolved, setMetricsInvolved] = useState<string[]>(
        initialData?.metrics_involved || []
    );
    const [isActionable, setIsActionable] = useState(
        initialData?.is_actionable || false
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!snapshotId) {
            newErrors.snapshot = 'Snapshot harus dipilih';
        }

        if (!statement.trim()) {
            newErrors.statement = 'Pernyataan wawasan harus diisi';
        } else if (statement.trim().length < 10) {
            newErrors.statement = 'Pernyataan wawasan minimal 10 karakter';
        } else if (statement.length > 1000) {
            newErrors.statement = 'Pernyataan wawasan maksimal 1000 karakter';
        }

        if (metricsInvolved.length === 0) {
            newErrors.metrics = 'Minimal satu metrik harus dipilih';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        if (snapshotId) {
            onSubmit({
                snapshot_id: snapshotId,
                statement: statement.trim(),
                severity,
                metrics_involved: metricsInvolved,
                is_actionable: isActionable
            });
        }
    };

    const toggleMetric = (metricId: string) => {
        setMetricsInvolved(prev =>
            prev.includes(metricId)
                ? prev.filter(m => m !== metricId)
                : [...prev, metricId]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Snapshot Selector */}
            <div className="space-y-2">
                <Label htmlFor="snapshot">Periode Snapshot *</Label>
                <Select
                    value={snapshotId?.toString()}
                    onValueChange={(value) => setSnapshotId(parseInt(value))}
                    disabled={!!initialData} // Can't change snapshot when editing
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih snapshot..." />
                    </SelectTrigger>
                    <SelectContent>
                        {snapshots.map((snapshot) => (
                            <SelectItem key={snapshot.id} value={snapshot.id.toString()}>
                                {snapshot.snapshot_name} ({snapshot.period_start} - {snapshot.period_end})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.snapshot && (
                    <p className="text-sm text-red-600">{errors.snapshot}</p>
                )}
            </div>

            {/* Statement */}
            <div className="space-y-2">
                <Label htmlFor="statement">Pernyataan Wawasan *</Label>
                <Textarea
                    id="statement"
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Tulis wawasan Anda berdasarkan data metrik..."
                    rows={4}
                    disabled={false}
                    className="resize-none"
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>{statement.length}/1000 karakter</span>
                    {errors.statement && (
                        <span className="text-red-600">{errors.statement}</span>
                    )}
                </div>
            </div>

            {/* Severity */}
            <div className="space-y-2">
                <Label>Tingkat Keparahan *</Label>
                <RadioGroup value={severity} onValueChange={(value: any) => setSeverity(value)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="normal" />
                        <Label htmlFor="normal" className="font-normal cursor-pointer">
                            Normal - Tidak memerlukan perhatian khusus
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="attention" id="attention" />
                        <Label htmlFor="attention" className="font-normal cursor-pointer">
                            Perhatian - Memerlukan monitoring
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="critical" id="critical" />
                        <Label htmlFor="critical" className="font-normal cursor-pointer">
                            Kritis - Memerlukan tindakan segera
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Metrics Involved */}
            <div className="space-y-2">
                <Label>Metrik Terkait *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-gray-200 rounded-lg">
                    {AVAILABLE_METRICS.map((metric) => (
                        <div key={metric.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={metric.id}
                                checked={metricsInvolved.includes(metric.id)}
                                onCheckedChange={() => toggleMetric(metric.id)}
                            />
                            <Label
                                htmlFor={metric.id}
                                className="font-normal cursor-pointer text-sm"
                            >
                                {metric.label}
                            </Label>
                        </div>
                    ))}
                </div>
                {errors.metrics && (
                    <p className="text-sm text-red-600">{errors.metrics}</p>
                )}
            </div>

            {/* Actionable */}
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="actionable"
                    checked={isActionable}
                    onCheckedChange={(checked) => setIsActionable(checked as boolean)}
                />
                <Label htmlFor="actionable" className="font-normal cursor-pointer">
                    Dapat Ditindaklanjuti (memerlukan rekomendasi atau tindakan)
                </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1"
                >
                    Batal
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1"
                >
                    {isLoading ? 'Menyimpan...' : 'Simpan Wawasan'}
                </Button>
            </div>
        </form>
    );
}
