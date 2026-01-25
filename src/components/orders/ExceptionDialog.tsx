// ============================================================================
// EXCEPTION DIALOG COMPONENT
// ============================================================================
// Purpose: Dialog for creating order exceptions
// Phase: 1.4 - Order Status Management
// ============================================================================

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// ============================================================================
// TYPES
// ============================================================================

type ExceptionType = 'stain_treatment' | 'delay' | 'damage' | 'missing_item' | 'other';
type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ExceptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: {
        exception_type: ExceptionType;
        severity: ExceptionSeverity;
        description: string;
    }) => Promise<void>;
}

const EXCEPTION_TYPES = [
    { value: 'stain_treatment', label: 'Stain Treatment' },
    { value: 'delay', label: 'Delay' },
    { value: 'damage', label: 'Damage' },
    { value: 'missing_item', label: 'Missing Item' },
    { value: 'other', label: 'Other' },
] as const;

const SEVERITY_LEVELS = [
    { value: 'low', label: 'Low', color: 'text-blue-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function ExceptionDialog({
    open,
    onOpenChange,
    onSubmit,
}: ExceptionDialogProps) {
    const [exceptionType, setExceptionType] = useState<ExceptionType>('other');
    const [severity, setSeverity] = useState<ExceptionSeverity>('medium');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        // Validation
        if (!description.trim()) {
            setError('Description is required');
            return;
        }

        if (description.trim().length < 10) {
            setError('Description must be at least 10 characters');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit({
                exception_type: exceptionType,
                severity,
                description: description.trim(),
            });

            // Reset form
            setExceptionType('other');
            setSeverity('medium');
            setDescription('');
            onOpenChange(false);
        } catch (err) {
            setError('Failed to create exception. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setExceptionType('other');
        setSeverity('medium');
        setDescription('');
        setError('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Exception</DialogTitle>
                    <DialogDescription>
                        Report an exception that occurred during order processing
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Exception Type */}
                    <div className="space-y-2">
                        <Label htmlFor="exception-type">Exception Type *</Label>
                        <Select
                            value={exceptionType}
                            onValueChange={(value) => setExceptionType(value as ExceptionType)}
                        >
                            <SelectTrigger id="exception-type">
                                <SelectValue placeholder="Select exception type" />
                            </SelectTrigger>
                            <SelectContent>
                                {EXCEPTION_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Severity */}
                    <div className="space-y-2">
                        <Label htmlFor="severity">Severity *</Label>
                        <Select
                            value={severity}
                            onValueChange={(value) => setSeverity(value as ExceptionSeverity)}
                        >
                            <SelectTrigger id="severity">
                                <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                                {SEVERITY_LEVELS.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                        <span className={level.color}>{level.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue in detail..."
                            rows={4}
                            className="resize-none"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{description.length} characters</span>
                            {error && <span className="text-red-600">{error}</span>}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Exception'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
