'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export default function OwnerTasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== UserRole.OWNER) {
            router.push('/');
            return;
        }
        fetchTasks();
    }, [router]);

    const fetchTasks = async () => {
        try {
            const response = await fetch('/api/analytics/tasks');
            const result = await response.json();
            if (result.success) {
                setTasks(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const response = await fetch(`/api/analytics/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) fetchTasks();
        } catch (error) {
            console.error('Failed to update task', error);
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
                                <CheckSquare className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Daftar Tugas</h1>
                                <p className="text-sm text-gray-500">Tindak Lanjut & Eksekusi</p>
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
                        <Link href="/owner/recommendations" className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">Rekomendasi</Link>
                        <Link href="/owner/tasks" className="border-b-2 border-purple-500 py-4 px-1 text-sm font-medium text-purple-600">Tugas</Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-end mb-6">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Buat Tugas Baru
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Belum ada tugas</h3>
                        <p className="text-gray-500">Tugas akan muncul saat Anda membuat rekomendasi actionable.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tasks.map(task => (
                            <Card key={task.id}>
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                                                    {task.priority?.toUpperCase()}
                                                </Badge>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                                            <p className="text-gray-600 mt-1">{task.description}</p>

                                            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" /> Assigned to: User #{task.assigned_to}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Badge variant="outline" className="capitalize text-center mb-2">{task.status.replace('_', ' ')}</Badge>
                                            {task.status !== 'resolved' && (
                                                <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'resolved')}>Mark Resolved</Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
