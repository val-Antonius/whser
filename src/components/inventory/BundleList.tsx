'use client';

interface Bundle {
    id: number;
    bundle_name: string;
    bundle_code: string;
    description?: string;
    item_count: number;
    is_active: boolean;
}

interface BundleListProps {
    bundles: Bundle[];
    onView?: (id: number) => void;
    onEdit?: (id: number) => void;
}

export default function BundleList({ bundles, onView, onEdit }: BundleListProps) {
    if (bundles.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
                No bundles created yet
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle) => (
                <div key={bundle.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-gray-900">{bundle.bundle_name}</h3>
                            <p className="text-sm text-gray-600">{bundle.bundle_code}</p>
                        </div>
                        {bundle.is_active ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
                        ) : (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Inactive</span>
                        )}
                    </div>

                    {bundle.description && (
                        <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                    )}

                    <div className="text-sm text-gray-700 mb-3">
                        <span className="font-semibold">{bundle.item_count}</span> items in bundle
                    </div>

                    <div className="flex gap-2">
                        {onView && (
                            <button
                                onClick={() => onView(bundle.id)}
                                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                            >
                                View Items
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={() => onEdit(bundle.id)}
                                className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 border border-gray-200 rounded hover:bg-gray-100"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
