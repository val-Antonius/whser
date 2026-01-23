import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Owner Analytics - Laundry Management',
    description: 'Post-operational analytics dashboard with AI-powered insights',
};

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {children}
        </div>
    );
}
