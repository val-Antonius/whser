// ============================================================================
// SWITCH COMPONENT (Animated Toggle)
// ============================================================================
// Purpose: Animated toggle switch for dashboard view mode
// Based on Radix UI patterns
// ============================================================================

'use client';

import * as React from 'react';

interface SwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
}

export function Switch({ checked, onCheckedChange, className = '' }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={`
                relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full 
                border-2 border-transparent transition-colors duration-200 ease-in-out 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${checked ? 'bg-blue-600' : 'bg-gray-200'}
                ${className}
            `}
        >
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-6 w-6 transform rounded-full 
                    bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                    ${checked ? 'translate-x-7' : 'translate-x-0'}
                `}
            />
        </button>
    );
}
