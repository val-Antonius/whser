// ============================================================================
// EXCEPTION CARD COMPONENT
// ============================================================================
// Purpose: Display order exception with status and resolution
// Phase: 1.4 - Order Status Management
// ============================================================================

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ExceptionType = 'stain_treatment' | 'delay' | 'damage' | 'missing_item' | 'other';
type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
type ExceptionStatus = 'open' | 'in_progress' | 'resolved' | 'escalated';

interface OrderException {
    id: number;
    order_id: number;
    exception_type: ExceptionType;
    description: string;
    severity: ExceptionSeverity;
    status: ExceptionStatus;
    resolution_notes: string | null;
    reported_by: number | null;
    reported_by_name?: string;
    resolved_by: number | null;
    resolved_by_name?: string;
    reported_at: string;
    resolved_at: string | null;
}

interface ExceptionCardProps {
    exception: OrderException;
    onResolve?: (id: number) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
    stain_treatment: 'Stain Treatment',
    delay: 'Delay',
    damage: 'Damage',
    missing_item: 'Missing Item',
    other: 'Other',
};

const SEVERITY_COLORS: Record<ExceptionSeverity, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<ExceptionStatus, string> = {
    open: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    escalated: 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<ExceptionStatus, typeof AlertCircle> = {
    open: AlertCircle,
    in_progress: Clock,
    resolved: CheckCircle2,
    escalated: AlertTriangle,
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ExceptionCard({ exception, onResolve }: ExceptionCardProps) {
    const StatusIcon = STATUS_ICONS[exception.status];
    const canResolve = (exception.status === 'open' || exception.status === 'in_progress') && onResolve;

    return (
        <Card className="mb-3">
            <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <StatusIcon className="h-5 w-5 text-gray-500" />
                        <h4 className="font-medium">
                            {EXCEPTION_TYPE_LABELS[exception.exception_type]}
                        </h4>
                    </div>
                    <div className="flex gap-2">
                        <Badge className={SEVERITY_COLORS[exception.severity]}>
                            {exception.severity.toUpperCase()}
                        </Badge>
                        <Badge className={STATUS_COLORS[exception.status]}>
                            {exception.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{exception.description}</p>

                <div className="text-xs text-gray-500 space-y-1">
                    <div>
                        Reported by: {exception.reported_by_name || `User #${exception.reported_by}`}
                    </div>
                    <div>
                        Reported at: {formatDate(exception.reported_at)}
                    </div>
                    {exception.resolved_at && (
                        <>
                            <div>
                                Resolved by: {exception.resolved_by_name || `User #${exception.resolved_by}`}
                            </div>
                            <div>
                                Resolved at: {formatDate(exception.resolved_at)}
                            </div>
                        </>
                    )}
                </div>

                {exception.resolution_notes && (
                    <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-1">Resolution Notes:</p>
                        <p className="text-sm text-green-700">{exception.resolution_notes}</p>
                    </div>
                )}

                {canResolve && (
                    <div className="mt-3 pt-3 border-t">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onResolve(exception.id)}
                        >
                            Mark as Resolved
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
