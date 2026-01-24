'use client';

interface Template {
    id: number;
    service_name: string;
    item_name: string;
    estimated_quantity: number;
    unit: string;
    notes?: string;
    created_at: string;
}

interface ConsumptionTemplateListProps {
    templates: Template[];
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
}

export default function ConsumptionTemplateList({
    templates,
    onEdit,
    onDelete
}: ConsumptionTemplateListProps) {
    if (templates.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                No consumption templates defined yet
            </div>
        );
    }

    // Group templates by service
    const groupedTemplates = templates.reduce((acc, template) => {
        if (!acc[template.service_name]) {
            acc[template.service_name] = [];
        }
        acc[template.service_name].push(template);
        return acc;
    }, {} as Record<string, Template[]>);

    return (
        <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([serviceName, serviceTemplates]) => (
                <div key={serviceName} className="bg-white border rounded-lg overflow-hidden">
                    {/* Service Header */}
                    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                        <h3 className="font-bold text-blue-900">{serviceName}</h3>
                        <p className="text-xs text-blue-700 mt-1">
                            {serviceTemplates.length} item{serviceTemplates.length !== 1 ? 's' : ''} configured
                        </p>
                    </div>

                    {/* Template List */}
                    <div className="divide-y">
                        {serviceTemplates.map((template) => (
                            <div key={template.id} className="p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {template.item_name}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            <span className="font-semibold text-blue-600">
                                                {template.estimated_quantity} {template.unit}
                                            </span>
                                            {' '}per order
                                        </div>
                                        {template.notes && (
                                            <div className="text-xs text-gray-500 mt-2 italic">
                                                {template.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 ml-4">
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(template.id)}
                                                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(template.id)}
                                                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
