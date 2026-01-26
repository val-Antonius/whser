import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Owner Analytics - Laundry Management',
    description: 'Post-operational analytics dashboard with AI-powered insights',
};

import LLMStatusIndicator from '@/components/analytics/LLMStatusIndicator';

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Bar for Demonstration/Status */}
            <div className='w-full bg-white border-b px-6 py-3 flex justify-between items-center'>
                <h1 className='text-lg font-bold text-gray-800'>Owner Dashboard</h1>
                <LLMStatusIndicator />
            </div>
            <div className="flex-1 p-6">
                {children}
            </div>
        </div>
    );
}
