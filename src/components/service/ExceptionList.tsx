'use client';

interface Exception {
    id: number;
    exception_type: string;
    description: string;
    severity: string;
    status: string;
    reported_at: string;
    resolved_at?: string;
    resolution_notes?: string;
}

interface ExceptionListProps {
    exceptions: Exception[];
    onResolve?: (exceptionId: number) => void;
}

export default function ExceptionList({ exceptions, onResolve }: ExceptionListProps) {
    if (exceptions.length === 0) {
        return (
            <div className="text-gray-500 text-sm italic">
                No exceptions reported
            </div>
        );
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'escalated': return 'bg-red-100 text-red-800';
            case 'open': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatType = (type: string) => {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="space-y-2">
            {exceptions.map((exception) => (
                <div
                    key={exception.id}
                    className={`border rounded-lg p-3 ${getSeverityColor(exception.severity)}`}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                    {formatType(exception.exception_type)}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(exception.status)}`}>
                                    {formatStatus(exception.status)}
                                </span>
                            </div>
                            <p className="text-sm">{exception.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-gray-600">
                            Reported: {new Date(exception.reported_at).toLocaleString()}
                        </span>
                        {exception.status === 'open' && onResolve && (
                            <button
                                onClick={() => onResolve(exception.id)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Resolve
                            </button>
                        )}
                    </div>

                    {exception.status === 'resolved' && exception.resolution_notes && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                            <p className="text-xs font-medium">Resolution:</p>
                            <p className="text-xs mt-1">{exception.resolution_notes}</p>
                            {exception.resolved_at && (
                                <p className="text-xs text-gray-600 mt-1">
                                    Resolved: {new Date(exception.resolved_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
