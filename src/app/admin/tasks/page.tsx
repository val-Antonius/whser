'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Task {
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
    due_date: string;
    created_at: string;
    insight_statement?: string;
}

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // In a real app, we'd get the current user ID from session/context on load
    // For MVP, we'll fetch all tasks or assume "my tasks" endpoint handles it by session
    // Since we don't have auth session fully wired in API, let's just fetch all tasks
    // and ideally the API would filter by logged in user.
    // For this demo, let's fetch all tasks and filter client side or via API param if we had user ID.
    // We'll mimic fetching "my tasks" by fetching all for now.

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/tasks'); // Fetch all tasks
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

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            // We need a specific route for updating tasks. 
            // Phase 5 plan mentioned src/app/api/tasks/[id]/route.ts
            // We haven't created that yet! We need to create it.
            // Assuming we will create it next.
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                fetchTasks();
            } else {
                alert('Gagal memperbarui status tugas');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Gagal memperbarui status tugas');
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Tinggi</Badge>;
            case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Sedang</Badge>;
            case 'low': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Rendah</Badge>;
            default: return <Badge variant="outline">{priority}</Badge>;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-50 border-blue-200';
            case 'in_progress': return 'bg-yellow-50 border-yellow-200';
            case 'resolved': return 'bg-green-50 border-green-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filterStatus === 'all') return true;
        return task.status === filterStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Daftar Tugas</h1>
                    <p className="text-muted-foreground">Kelola tugas operasional yang diberikan</p>
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Selesai</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-gray-500">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">Tidak ada tugas ditemukan</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => (
                        <Card key={task.id} className={`transition-all hover:shadow-md ${getStatusColor(task.status)}`}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-medium leading-tight">
                                            {task.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 pt-1">
                                            {getPriorityBadge(task.priority)}
                                            <span className="text-xs text-gray-500">
                                                {new Date(task.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    {task.status === 'resolved' && (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                    {task.description || 'Tidak ada deskripsi'}
                                </p>
                                {task.insight_statement && (
                                    <div className="bg-white/50 p-2 rounded text-xs text-gray-500 border border-gray-100">
                                        Root Cause: {task.insight_statement}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0 flex justify-between items-center">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {task.status.replace('_', ' ')}
                                </div>

                                <div className="flex gap-2">
                                    {task.status === 'open' && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => updateStatus(task.id, 'in_progress')}
                                        >
                                            Mulai
                                        </Button>
                                    )}
                                    {task.status === 'in_progress' && (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => updateStatus(task.id, 'resolved')}
                                        >
                                            Selesai
                                        </Button>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
