'use client';

// ============================================================================
// OWNER INSIGHTS PAGE
// ============================================================================
// Purpose: Manual insight creation and management
// Phase: 3.4 - Manual Insight Creation
// ============================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types';
import { InsightCard } from '@/components/analytics/InsightCard';
import { InsightForm } from '@/components/analytics/InsightForm';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Filter } from 'lucide-react';

interface Snapshot {
    id: number;
    snapshot_name: string;
    period_start: string;
    period_end: string;
}

interface Insight {
    id: number;
    snapshot_id: number;
    statement: string;
    severity: 'normal' | 'attention' | 'critical';
    metrics_involved: string[];
    is_actionable: boolean;
    created_at: string;
}

export default function OwnerInsights() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);

    // Filters
    const [selectedSnapshot, setSelectedSnapshot] = useState<string>('all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    const [selectedActionable, setSelectedActionable] = useState<string>('all');

    // Create/Edit Dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== UserRole.OWNER) {
            router.push('/');
            return;
        }
        setIsLoading(false);
        fetchSnapshots();
        fetchInsights();
    }, [router]);

    const fetchSnapshots = async () => {
        try {
            const response = await fetch('/api/analytics/snapshots');
            const data = await response.json();
            if (data.success && data.data) {
                setSnapshots(data.data);
            }
        } catch (error) {
            console.error('Error fetching snapshots:', error);
        }
    };

    const fetchInsights = async () => {
        try {
            const response = await fetch('/api/analytics/insights');
            const data = await response.json();
            if (data.success && data.data) {
                setInsights(data.data);
                setFilteredInsights(data.data);
            }
        } catch (error) {
            console.error('Error fetching insights:', error);
        }
    };

    // Apply filters
    useEffect(() => {
        let filtered = [...insights];

        if (selectedSnapshot !== 'all') {
            filtered = filtered.filter(i => i.snapshot_id === parseInt(selectedSnapshot));
        }

        if (selectedSeverity !== 'all') {
            filtered = filtered.filter(i => i.severity === selectedSeverity);
        }

        if (selectedActionable !== 'all') {
            const isActionable = selectedActionable === 'true';
            filtered = filtered.filter(i => i.is_actionable === isActionable);
        }

        setFilteredInsights(filtered);
    }, [selectedSnapshot, selectedSeverity, selectedActionable, insights]);

    const handleCreateInsight = async (data: any) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/analytics/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                setIsCreateDialogOpen(false);
                fetchInsights();
            } else {
                alert(result.error || 'Gagal membuat wawasan');
            }
        } catch (error) {
            console.error('Error creating insight:', error);
            alert('Gagal membuat wawasan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditInsight = async (data: any) => {
        if (!editingInsight) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/analytics/insights/${editingInsight.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                setIsEditDialogOpen(false);
                setEditingInsight(null);
                fetchInsights();
            } else {
                alert(result.error || 'Gagal memperbarui wawasan');
            }
        } catch (error) {
            console.error('Error updating insight:', error);
            alert('Gagal memperbarui wawasan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInsight = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus wawasan ini?')) {
            return;
        }

        try {
            const response = await fetch(`/api/analytics/insights/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                fetchInsights();
            } else {
                alert(result.error || 'Gagal menghapus wawasan');
            }
        } catch (error) {
            console.error('Error deleting insight:', error);
            alert('Gagal menghapus wawasan');
        }
    };

    const openEditDialog = (id: number) => {
        const insight = insights.find(i => i.id === id);
        if (insight) {
            setEditingInsight(insight);
            setIsEditDialogOpen(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Wawasan Bisnis</h1>
                                <p className="text-sm text-gray-500">Peran Pemilik</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('userRole');
                                router.push('/');
                            }}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Ganti Peran
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <Link
                            href="/owner/analytics"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Analitik
                        </Link>
                        <Link
                            href="/owner/insights"
                            className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-600"
                        >
                            Wawasan
                        </Link>
                        <Link
                            href="/owner/recommendations"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Rekomendasi
                        </Link>
                        <Link
                            href="/owner/tasks"
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Tugas
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
                    <h2 className="text-3xl font-bold mb-2">Wawasan Bisnis</h2>
                    <p className="text-purple-100">Catat dan kelola wawasan berdasarkan analisis metrik</p>
                </div>

                {/* Actions & Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Buat Wawasan Baru
                        </Button>

                        <div className="flex gap-3">
                            <Select value={selectedSnapshot} onValueChange={setSelectedSnapshot}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Semua Snapshot" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Snapshot</SelectItem>
                                    {snapshots.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.snapshot_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua Keparahan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="critical">Kritis</SelectItem>
                                    <SelectItem value="attention">Perhatian</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedActionable} onValueChange={setSelectedActionable}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="true">Actionable</SelectItem>
                                    <SelectItem value="false">Non-Actionable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Insights List */}
                {filteredInsights.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Wawasan</h3>
                        <p className="text-gray-600 mb-6">Buat wawasan pertama Anda berdasarkan analisis metrik</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Wawasan
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredInsights.map(insight => {
                            const snapshot = snapshots.find(s => s.id === insight.snapshot_id);
                            return (
                                <InsightCard
                                    key={insight.id}
                                    insight={insight}
                                    snapshotName={snapshot?.snapshot_name}
                                    onEdit={openEditDialog}
                                    onDelete={handleDeleteInsight}
                                />
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Buat Wawasan Baru</DialogTitle>
                        <DialogDescription>
                            Tulis wawasan berdasarkan analisis metrik dari snapshot
                        </DialogDescription>
                    </DialogHeader>
                    <InsightForm
                        snapshots={snapshots}
                        onSubmit={handleCreateInsight}
                        onCancel={() => setIsCreateDialogOpen(false)}
                        isLoading={isSubmitting}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Wawasan</DialogTitle>
                        <DialogDescription>
                            Perbarui wawasan Anda
                        </DialogDescription>
                    </DialogHeader>
                    {editingInsight && (
                        <InsightForm
                            snapshots={snapshots}
                            initialData={editingInsight}
                            onSubmit={handleEditInsight}
                            onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingInsight(null);
                            }}
                            isLoading={isSubmitting}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
