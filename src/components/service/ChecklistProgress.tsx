'use client';

interface ChecklistProgressProps {
    completedCount: number;
    totalCount: number;
    requiredCount: number;
    completedRequiredCount: number;
}

export default function ChecklistProgress({
    completedCount,
    totalCount,
    requiredCount,
    completedRequiredCount
}: ChecklistProgressProps) {
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const isComplete = completedCount === totalCount;
    const allRequiredComplete = completedRequiredCount === requiredCount;

    return (
        <div className="space-y-2">
            {/* Progress Bar */}
            <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">
                        {Math.round(percentage)}%
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                    <span className={isComplete ? 'text-green-600 font-bold' : 'text-gray-700'}>
                        {completedCount}/{totalCount} Complete
                    </span>
                    {requiredCount > 0 && (
                        <span className={`text-xs ${allRequiredComplete ? 'text-green-600' : 'text-orange-600'}`}>
                            {allRequiredComplete ? '✓' : '⚠️'} Required: {completedRequiredCount}/{requiredCount}
                        </span>
                    )}
                </div>
                {isComplete && (
                    <span className="text-green-600 font-bold text-sm">✓ All Done!</span>
                )}
            </div>

            {/* Warning */}
            {!allRequiredComplete && (
                <div className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                    ⚠️ {requiredCount - completedRequiredCount} required item(s) remaining
                </div>
            )}
        </div>
    );
}
