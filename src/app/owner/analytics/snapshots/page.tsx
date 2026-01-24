'use client';

// ============================================================================
// SNAPSHOT MANAGER - Separate page for data snapshot management
// ============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Lock, Unlock, Plus, Calendar, RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import { PeriodType } from '@/types';

interface Snapshot {
    id: number;
    snapshot_name: string;
    period_type: PeriodType;
    period_start: string;
    period_end: string;
    snapshot_date: string;
    is_locked: boolean;
    total_orders: number;
    total_revenue: number;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export default function SnapshotsPage() {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.WEEKLY);
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [snapshotName, setSnapshotName] = useState('');

    useEffect(() => {
        fetchSnapshots();
    }, []);

    useEffect(() => {
        if (showCreateDialog) {
            loadSuggestedPeriod();
        }
    }, [showCreateDialog, periodType]);

    const fetchSnapshots = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/analytics/snapshots');
            const data = await response.json();
            if (data.success) {
                setSnapshots(data.data);
            }
        } catch (error) {
            console.error('Error fetching snapshots:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSuggestedPeriod = async () => {
        try {
            const response = await fetch(`/api/analytics/snapshots/suggested-period?periodType=${periodType}`);
            const data = await response.json();
            if (data.success) {
                setPeriodStart(data.data.start);
                setPeriodEnd(data.data.end);
                setSnapshotName(`${periodType.toUpperCase()}_${data.data.start}_${data.data.end}`);
            }
        } catch (error) {
            console.error('Error loading suggested period:', error);
        }
    };

    const handleCreateSnapshot = async () => {
        setIsCreating(true);
        try {
            const response = await fetch('/api/analytics/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    periodType,
                    periodStart,
                    periodEnd,
                    snapshotName,
                    createdBy: 1
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowCreateDialog(false);
                fetchSnapshots();
                setPeriodType(PeriodType.WEEKLY);
                setPeriodStart('');
                setPeriodEnd('');
                setSnapshotName('');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating snapshot:', error);
            alert('Failed to create snapshot');
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleLock = async (id: number, currentLockState: boolean) => {
        try {
            const response = await fetch('/api/analytics/snapshots', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isLocked: !currentLockState })
            });

            const data = await response.json();
            if (data.success) {
                fetchSnapshots();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error toggling lock:', error);
        }
    };

    const handleDeleteSnapshot = async (id: number) => {
        if (!confirm('Yakin ingin menghapus snapshot ini?')) {
            return;
        }

        try {
            const response = await fetch(`/api/analytics/snapshots?id=${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                fetchSnapshots();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error deleting snapshot:', error);
        }
    };

    const getPeriodTypeColor = (type: PeriodType) => {
        switch (type) {
            case PeriodType.DAILY: return 'bg-blue-100 text-blue-800';
            case PeriodType.WEEKLY: return 'bg-green-100 text-green-800';
            case PeriodType.MONTHLY: return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-4">
                            <Link href="/owner/analytics" className="text-gray-500 hover:text-gray-700">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Data Snapshots</h1>
                                <p className="text-sm text-gray-500">Manage historical data snapshots</p>
                            </div>
                        </div>
                        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                            <DialogTrigger asChild>
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Snapshot
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Create Data Snapshot</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Period Type</label>
                                        <Select value={periodType} onValueChange={(value) => setPeriodType(value as PeriodType)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={PeriodType.DAILY}>Daily</SelectItem>
                                                <SelectItem value={PeriodType.WEEKLY}>Weekly</SelectItem>
                                                <SelectItem value={PeriodType.MONTHLY}>Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Start Date</label>
                                            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">End Date</label>
                                            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Snapshot Name (Optional)</label>
                                        <Input value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} placeholder="Auto-generated if empty" />
                                    </div>

                                    <Button onClick={handleCreateSnapshot} disabled={isCreating || !periodStart || !periodEnd} className="w-full bg-purple-600 hover:bg-purple-700">
                                        {isCreating ? 'Creating...' : 'Create Snapshot'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Snapshots</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Database className="h-8 w-8 text-purple-600" />
                                <span className="text-3xl font-bold">{snapshots.length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Locked Snapshots</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Lock className="h-8 w-8 text-green-600" />
                                <span className="text-3xl font-bold">{snapshots.filter(s => s.is_locked).length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Snapshot</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-8 w-8 text-blue-600" />
                                <span className="text-lg font-semibold">
                                    {snapshots.length > 0 ? new Date(snapshots[0].snapshot_date).toLocaleDateString('en-US') : '-'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Snapshot History</CardTitle>
                        <Button variant="ghost" size="sm" onClick={fetchSnapshots}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">Loading...</div>
                        ) : snapshots.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No snapshots yet. Create your first snapshot!
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead className="text-right">Orders</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {snapshots.map((snapshot) => (
                                        <TableRow key={snapshot.id}>
                                            <TableCell className="font-medium">{snapshot.snapshot_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getPeriodTypeColor(snapshot.period_type)}>
                                                    {snapshot.period_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(snapshot.period_start).toLocaleDateString('en-US')} - {new Date(snapshot.period_end).toLocaleDateString('en-US')}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{snapshot.total_orders}</TableCell>
                                            <TableCell className="text-right font-semibold">Rp {snapshot.total_revenue.toLocaleString('id-ID')}</TableCell>
                                            <TableCell>
                                                {snapshot.is_locked ? (
                                                    <Badge className="bg-green-600">
                                                        <Lock className="h-3 w-3 mr-1" />
                                                        Locked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        <Unlock className="h-3 w-3 mr-1" />
                                                        Unlocked
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleToggleLock(snapshot.id, snapshot.is_locked)}>
                                                        {snapshot.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                    </Button>
                                                    {!snapshot.is_locked && (
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSnapshot(snapshot.id)} className="text-red-600 hover:text-red-700">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
