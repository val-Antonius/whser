'use client';

interface SLAAlert {
    id: number;
    order_id: number;
    alert_type: 'approaching' | 'breached' | 'critical';
    alert_message: string;
    hours_remaining: number | null;
    is_acknowledged: boolean;
    created_at: string;
}

interface SLAAlertBannerProps {
    alerts: SLAAlert[];
    onAcknowledge: (alertId: number) => void;
}

export default function SLAAlertBanner({ alerts, onAcknowledge }: SLAAlertBannerProps) {
    const unacknowledgedAlerts = alerts.filter(alert => !alert.is_acknowledged);

    if (unacknowledgedAlerts.length === 0) {
        return null;
    }

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'critical': return 'bg-red-600 border-red-700';
            case 'breached': return 'bg-orange-500 border-orange-600';
            case 'approaching': return 'bg-yellow-500 border-yellow-600';
            default: return 'bg-gray-500 border-gray-600';
        }
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'critical': return '🚨';
            case 'breached': return '⚠️';
            case 'approaching': return '⏰';
            default: return '📢';
        }
    };

    return (
        <div className="space-y-2 mb-4">
            {unacknowledgedAlerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`${getAlertColor(alert.alert_type)} text-white border-2 rounded-lg p-4 shadow-lg`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <span className="text-2xl">{getAlertIcon(alert.alert_type)}</span>
                            <div className="flex-1">
                                <div className="font-bold text-lg mb-1">
                                    {alert.alert_type.toUpperCase()} - Order #{alert.order_id}
                                </div>
                                <p className="text-sm opacity-90">{alert.alert_message}</p>
                                {alert.hours_remaining !== null && (
                                    <p className="text-xs mt-2 opacity-75">
                                        {alert.hours_remaining > 0
                                            ? `${alert.hours_remaining.toFixed(1)} hours remaining`
                                            : `${Math.abs(alert.hours_remaining).toFixed(1)} hours overdue`
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => onAcknowledge(alert.id)}
                            className="ml-4 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors"
                        >
                            Acknowledge
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
