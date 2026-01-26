'use client';

import React, { useEffect, useState } from 'react';

export default function LLMStatusIndicator() {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/ollama/status');
                const data = await res.json();
                setIsOnline(data.online);
            } catch (e) {
                setIsOnline(false);
            }
        };

        // Initial check
        checkStatus();

        // Poll every 30 seconds
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isOnline === null) return null; // Loading state

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full text-xs shadow-sm" title={isOnline ? "AI Service Online" : "AI Service Offline"}>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium text-gray-600">
                AI {isOnline ? 'Online' : 'Offline'}
            </span>
        </div>
    );
}
