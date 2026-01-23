import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard - Laundry Management',
    description: 'Operational application for daily laundry workflow management',
};

export default function AdminLayout({
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
