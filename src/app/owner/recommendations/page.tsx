'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus } from 'lucide-react';
import Link from 'next/link';
import { RecommendationList } from '@/components/analytics/RecommendationList';
import { CreateRecommendationDialog } from '@/components/analytics/CreateRecommendationDialog';

export default function OwnerRecommendationsPage() {
    const router = useRouter();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== UserRole.OWNER) {
            router.push('/');
            return;
        }
        fetchRecommendations();
    }, [router]);

    const fetchRecommendations = async () => {
        try {
            const response = await fetch('/api/analytics/recommendations');
            const result = await response.json();
            if (result.success) {
                setRecommendations(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            // If accepting, create a task first
            if (status === 'accepted') {
                const taskRes = await fetch('/api/analytics/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from_recommendation: true,
                        recommendation_id: id,
                        created_by: 1 // Default owner user
                    })
                });

                if (!taskRes.ok) {
                    console.error('Failed to create task from recommendation');
                    // Optional: Show error to user
                    return;
                }
            }

            const response = await fetch(`/api/analytics/recommendations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) fetchRecommendations();
        } catch (error) {
            console.error('Failed to update recommendation', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                <Lightbulb className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Rekomendasi Sistem</h1>
                                <p className="text-sm text-gray-500">Saran Perbaikan & Optimasi</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => router.push('/owner/analytics')}>
                            Kembali ke Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <Link href="/owner/analytics" className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">Analitik</Link>
                        <Link href="/owner/insights" className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">Wawasan</Link>
                        <Link href="/owner/recommendations" className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-600">Rekomendasi</Link>
                        <Link href="/owner/tasks" className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">Tugas</Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-end mb-6 gap-2">
                    <Button
                        variant="secondary"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                // 1. Fetch latest snapshot
                                const snapRes = await fetch('/api/analytics/snapshots');
                                const snapData = await snapRes.json();

                                if (!snapData.success || !snapData.data || snapData.data.length === 0) {
                                    alert('Tidak ada snapshot data ditemukan. Silakan buat snapshot di halaman Analitik.');
                                    setLoading(false);
                                    return;
                                }

                                // Assume sorted by date desc or id desc
                                const latestSnapshotId = snapData.data[0].id; // First item is usually latest

                                // 2. Generate Recommendations
                                const res = await fetch('/api/analytics/recommendations/generate', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ snapshotId: latestSnapshotId })
                                });
                                const result = await res.json();
                                if (result.success) {
                                    alert(result.message);
                                    fetchRecommendations();
                                } else {
                                    alert('Gagal: ' + result.error);
                                }
                            } catch (e) {
                                alert('Error connecting to AI');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                    >
                        ✨ Analisis AI
                    </Button>
                    <CreateRecommendationDialog onRecommendationCreated={fetchRecommendations} />
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading recommendations...</div>
                ) : (
                    <RecommendationList
                        recommendations={recommendations}
                        onStatusUpdate={handleStatusUpdate}
                    />
                )}
            </main>
        </div>
    );
}
