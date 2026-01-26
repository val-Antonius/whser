'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Plus, Filter, CheckCircle, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
    due_date: string;
    created_at: string;
    assigned_to_name?: string;
    insight_statement?: string;
}

export default function OwnerTasks() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    // Create Task Dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== UserRole.OWNER) {
            router.push('/');
            return;
        }
        fetchTasks();
    }, [router]);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/tasks');
            const result = await response.json();
            if (result.success) {
                setTasks(result.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTask = async (data: any) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    created_by: 1, // Mock Owner ID
                })
            });

            const result = await response.json();
            if (result.success) {
                setIsCreateDialogOpen(false);
                fetchTasks();
                alert('Tugas berhasil dibuat!');
            } else {
                alert('Gagal membuat tugas: ' + result.error);
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Terjadi kesalahan saat membuat tugas');
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkEffectiveness = async (id: number) => {
        try {
            const response = await fetch(`/api/tasks/${id}/effectiveness`);
            const result = await response.json();

            if (result.success && result.data) {
                const { metric_name, origin_value, comparison_value, comparison_snapshot_name } = result.data;
                if (comparison_value !== null) {
                    alert(`Analisis Efektivitas:\n\nMetrik: ${metric_name}\nNilai Awal: ${origin_value}\nNilai Terbaru (${comparison_snapshot_name}): ${comparison_value}\n\nPerubahan: ${(comparison_value - origin_value).toFixed(2)}`);
                } else {
                    alert('Belum ada snapshot baru untuk membandingkan hasil.');
                }
            } else {
                alert(result.message || 'Gagal mengecek efektivitas');
            }
        } catch (error) {
            console.error('Error checking effectiveness:', error);
            alert('Gagal mengecek efektivitas');
        }
    };

    const handleDeleteTask = async (id: number) => {
        // ... existing delete logic
        if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;

        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchTasks();
            } else {
                alert('Gagal menghapus tugas');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
            case 'in_progress': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">In Progress</Badge>;
            case 'resolved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Resolved</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filterStatus !== 'all' && task.status !== filterStatus) return false;
        if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
        return true;
    });

    const openTasksCount = tasks.filter(t => t.status === 'open').length;
    const progressTasksCount = tasks.filter(t => t.status === 'in_progress').length;
    const resolvedTasksCount = tasks.filter(t => t.status === 'resolved').length;

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
                                <h1 className="text-xl font-bold text-gray-900">Monitor Tugas</h1>
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
                            className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                            className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-600"
                        >
                            Tugas
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Tugas Terbuka</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{openTasksCount}</div>
                            <p className="text-xs text-gray-500">Menunggu dikerjakan</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Sedang Proses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{progressTasksCount}</div>
                            <p className="text-xs text-gray-500">Sedang dikerjakan admin</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Selesai</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{resolvedTasksCount}</div>
                            <p className="text-xs text-gray-500">Telah diselesaikan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Daftar Tugas</h2>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Prioritas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Prioritas</SelectItem>
                                <SelectItem value="high">Tinggi</SelectItem>
                                <SelectItem value="medium">Sedang</SelectItem>
                                <SelectItem value="low">Rendah</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Tugas
                        </Button>
                    </div>
                </div>

                {/* Task List */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredTasks.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada tugas</h3>
                            <p className="text-gray-600">Sesuaikan filter atau buat tugas baru.</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                                                {getStatusBadge(task.status)}
                                                <Badge variant="outline">{task.priority}</Badge>
                                            </div>
                                            <p className="text-gray-600">{task.description || 'Tidak ada deskripsi'}</p>

                                            <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Assignee: {task.assigned_to_name || 'Admin'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {task.status === 'resolved' && task.insight_statement && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                                                    onClick={() => checkEffectiveness(task.id)}
                                                >
                                                    Cek Efektivitas
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteTask(task.id)}
                                            >
                                                Hapus
                                            </Button>
                                            {task.insight_statement && (
                                                <Link href="/owner/insights">
                                                    <Button variant="link" className="text-purple-600 h-auto p-0 text-xs">
                                                        Lihat Wawasan <ArrowUpRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </main>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Buat Tugas Operasional</DialogTitle>
                        <DialogDescription>
                            Delegasikan tugas kepada admin toko
                        </DialogDescription>
                    </DialogHeader>
                    <TaskForm
                        onSubmit={handleCreateTask}
                        onCancel={() => setIsCreateDialogOpen(false)}
                        isLoading={isSubmitting}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
