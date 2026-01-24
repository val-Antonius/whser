'use client';

interface ChecklistItem {
    id: number;
    checklist_item: string;
    is_required: boolean;
    is_completed: boolean;
    completed_at?: string;
    completed_by?: number;
}

interface ProcessChecklistProps {
    orderId: number;
    items: ChecklistItem[];
    onItemToggle: (checklistId: number, isCompleted: boolean) => void;
    disabled?: boolean;
}

export default function ProcessChecklist({ orderId, items, onItemToggle, disabled = false }: ProcessChecklistProps) {
    if (items.length === 0) {
        return (
            <div className="text-gray-500 text-sm italic">
                No checklist items for this process
            </div>
        );
    }

    const completedCount = items.filter(item => item.is_completed).length;
    const totalCount = items.length;
    const requiredCount = items.filter(item => item.is_required).length;
    const completedRequiredCount = items.filter(item => item.is_required && item.is_completed).length;

    return (
        <div className="space-y-3">
            {/* Progress Summary */}
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                    Progress: {completedCount}/{totalCount}
                </span>
                {requiredCount > 0 && (
                    <span className={`text-xs ${completedRequiredCount === requiredCount ? 'text-green-600' : 'text-orange-600'}`}>
                        Required: {completedRequiredCount}/{requiredCount}
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all ${completedCount === totalCount ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-3 p-2 rounded ${item.is_completed ? 'bg-green-50' : 'bg-white'
                            } border ${item.is_completed ? 'border-green-200' : 'border-gray-200'}`}
                    >
                        <input
                            type="checkbox"
                            checked={item.is_completed}
                            onChange={(e) => onItemToggle(item.id, e.target.checked)}
                            disabled={disabled}
                            className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {item.checklist_item}
                                </span>
                                {item.is_required && (
                                    <span className="text-xs text-red-600 font-medium">*</span>
                                )}
                            </div>
                            {item.is_completed && item.completed_at && (
                                <span className="text-xs text-gray-500">
                                    Completed: {new Date(item.completed_at).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Warning for incomplete required items */}
            {completedRequiredCount < requiredCount && (
                <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                    ⚠️ {requiredCount - completedRequiredCount} required item(s) remaining
                </div>
            )}
        </div>
    );
}
