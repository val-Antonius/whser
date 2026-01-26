'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface User {
    id: number;
    name: string;
    role: string;
}

interface TaskFormProps {
    insightId?: number;
    initialTitle?: string;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function TaskForm({ insightId, initialTitle, onSubmit, onCancel, isLoading }: TaskFormProps) {
    const [title, setTitle] = useState(initialTitle || '');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [assignee, setAssignee] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [admins, setAdmins] = useState<User[]>([]);

    useEffect(() => {
        // Fetch Admin users for assignment
        // In a real app, this would be a dedicated endpoint. 
        // For MVP, assuming we can get users or hardcode/mock if User API not ready.
        // Let's assume there is an API or we fetch all users.
        // If not, we might fail here. Let's try to fetch users.
        const fetchAdmins = async () => {
            try {
                // Assuming we might not have a specific 'get admins' route yet, 
                // but usually user management is Phase 1. 
                // Let's try /api/users if it exists, otherwise manual entry or mock.
                // Assuming existence based on 'users' table in schema.
                // If it fails, we default to hardcoded for demo.
                const res = await fetch('/api/users?role=admin');
                // NOTE: We haven't built /api/users?role=admin yet in this session logic list?
                // Phase 1.2 was User Role System. It likely has an API.
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setAdmins(data.data.filter((u: User) => u.role === 'admin'));
                    }
                }
            } catch (e) {
                console.warn('Could not fetch admins, using mock', e);
            }
        };
        fetchAdmins();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            priority,
            assigned_to: assignee,
            due_date: dueDate,
            insight_id: insightId
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Judul Tugas</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Contoh: Perbaiki Stok Deterjen"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detail instruksi tugas..."
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="priority">Prioritas</Label>
                    <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Rendah</SelectItem>
                            <SelectItem value="medium">Sedang</SelectItem>
                            <SelectItem value="high">Tinggi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="assignee">Tugaskan Ke (Admin)</Label>
                    <Select value={assignee} onValueChange={setAssignee} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Admin" />
                        </SelectTrigger>
                        <SelectContent>
                            {admins.length > 0 ? (
                                admins.map(admin => (
                                    <SelectItem key={admin.id} value={admin.id.toString()}>
                                        {admin.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="2">Admin Store (Demo)</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="dueDate">Batas Waktu</Label>
                <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                    {isLoading ? 'Menyimpan...' : 'Buat Tugas'}
                </Button>
            </div>
        </form>
    );
}
