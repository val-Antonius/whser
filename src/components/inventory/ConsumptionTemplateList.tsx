'use client';

import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Template {
    id: number;
    service_id: number; // Added service_id
    service_name: string;
    item_name: string;
    estimated_quantity: number;
    unit: string;
    notes?: string;
    created_at: string;
}

interface ConsumptionTemplateListProps {
    templates: Template[];
    onEdit?: (serviceId: number) => void;
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
                No service recipes defined yet. Click "Manage Recipes" to create one.
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
            {Object.entries(groupedTemplates).map(([serviceName, serviceTemplates]) => {
                const serviceId = serviceTemplates[0]?.service_id;

                return (
                    <div key={serviceName} className="bg-white border rounded-lg overflow-hidden relative">
                        {/* Service Header */}
                        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-blue-900">{serviceName}</h3>
                                <p className="text-xs text-blue-700 mt-1">
                                    {serviceTemplates.length} ingredients configured
                                </p>
                            </div>
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(serviceId)}
                                    className="h-8 bg-white hover:bg-blue-100 text-blue-700 border-blue-200"
                                >
                                    <Edit className="w-3 h-3 mr-1" /> Edit Recipe
                                </Button>
                            )}
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
                                                    {parseFloat(String(template.estimated_quantity))} {template.unit === 'per_kg' ? '/ kg' : template.unit === 'per_pc' ? '/ pcs' : '/ order'}
                                                </span>
                                                {' '}({template.unit})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
