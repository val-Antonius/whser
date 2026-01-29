'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Zap, User, Briefcase, Tag, Filter, ChevronRight, Activity, Info, Calendar } from "lucide-react";

interface AgingOrder {
    id: number;
    order_number: string;
    current_status: string;
    stage_group: string;
    is_priority: boolean;
    total_aging_hours: number;
    created_at: string;
    estimated_price: number;
    customer_name: string;
    service_name: string;
}

interface AgingStats {
    total_orders: number;
    critical: number;
    warning: number;
    priority_count: number;
    avg_aging: number;
}

export default function OrderAgingReportPage() {
    const [orders, setOrders] = useState<AgingOrder[]>([]);
    const [stats, setStats] = useState<AgingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState('active'); // Default to active only
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');

    useEffect(() => {
        fetchAgingReport();
    }, [statusFilter, priorityFilter, minAge, maxAge]);

    const fetchAgingReport = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter);
            if (minAge) params.append('min_age', minAge);
            if (maxAge) params.append('max_age', maxAge);

            const response = await fetch(`/api/reports/aging-v2?${params.toString()}`);
            if (!response.ok) throw new Error('Gagal mengambil laporan aging');

            const result = await response.json();
            if (result.success) {
                setOrders(result.data.orders);
                setStats(result.data.stats);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    const getAgingStyles = (hours: number) => {
        if (hours > 72) return { style: 'bg-rose-50/50 text-rose-700 border-rose-100', label: 'KRITIS (>72j)' };
        if (hours > 48) return { style: 'bg-amber-50/50 text-amber-700 border-amber-100', label: 'WARNING (>48j)' };
        if (hours > 24) return { style: 'bg-sky-50/50 text-sky-700 border-sky-100', label: 'NORMAL (>24j)' };
        return { style: 'bg-emerald-50/50 text-emerald-700 border-emerald-100', label: 'BARU (<24j)' };
    };

    const formatDuration = (hours: number) => {
        if (!hours) return '0j';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        return `${Math.round(hours)}j`;
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-slate-800 tracking-tight">Laporan Aging Pesanan</h1>
                        <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">Analisis Kecepatan & Bottleneck Operasional</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/40 border border-white/60 rounded-2xl backdrop-blur-sm">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live Metrics</span>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl border border-blue-100">
                                    <Tag className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pesanan</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{stats.total_orders}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kritis ({'>'}72j)</p>
                                    <h3 className="text-2xl font-bold text-rose-600">{stats.critical}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl border border-amber-100">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warning (48-72j)</p>
                                    <h3 className="text-2xl font-bold text-amber-600">{stats.warning}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl border border-indigo-100">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rerata Durasi</p>
                                    <h3 className="text-2xl font-bold text-indigo-700">{formatDuration(stats.avg_aging)}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white/60 backdrop-blur-sm border border-white/60 p-6 rounded-3xl mb-8 shadow-sm">
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        Penyaringan Data
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Status Progres</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-white/80 border-slate-200 rounded-xl h-11">
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="active">Aktif (Belum Selesai)</SelectItem>
                                    <SelectItem value="received">Diterima (Received)</SelectItem>
                                    <SelectItem value="in_wash">Proses Cuci</SelectItem>
                                    <SelectItem value="ready_for_qc">Siap QC</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Prioritas Layanan</label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="bg-white/80 border-slate-200 rounded-xl h-11">
                                    <SelectValue placeholder="Pilih Prioritas" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Semua Layanan</SelectItem>
                                    <SelectItem value="true">Prioritas (Express)</SelectItem>
                                    <SelectItem value="false">Reguler</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Min. Durasi (Jam)</label>
                            <Input
                                type="number"
                                value={minAge}
                                onChange={(e) => setMinAge(e.target.value)}
                                className="bg-white/80 border-slate-200 rounded-xl h-11 focus:ring-sky-500/20"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Max. Durasi (Jam)</label>
                            <Input
                                type="number"
                                value={maxAge}
                                onChange={(e) => setMaxAge(e.target.value)}
                                className="bg-white/80 border-slate-200 rounded-xl h-11 focus:ring-sky-500/20"
                                placeholder="999"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-3xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-sky-500" />
                            Detail Penuaan Pesanan
                        </h2>
                        {!loading && (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 font-mono text-[10px] px-2 py-0.5 border-slate-100 uppercase tracking-tighter">
                                {orders.length} orders
                            </Badge>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                                    <TableHead className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pesanan</TableHead>
                                    <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informasi Pelanggan</TableHead>
                                    <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status & Layanan</TableHead>
                                    <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indikator Aging</TableHead>
                                    <TableHead className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimasi Nilai</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                                                <span className="text-sm font-medium text-slate-400">Menganalisis durasi...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-24 text-center text-slate-400 italic">
                                            <div className="flex flex-col items-center gap-2">
                                                <Info className="h-10 w-10 text-slate-200" />
                                                <p>Tidak ada pesanan yang sesuai filter.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => {
                                        const aging = getAgingStyles(order.total_aging_hours);
                                        return (
                                            <TableRow key={order.id} className="hover:bg-slate-50/30 transition-colors border-slate-50 group">
                                                <TableCell className="px-8 py-4 px-8 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <Link
                                                            href={`/admin/orders/${order.id}`}
                                                            className="text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1 group/link"
                                                        >
                                                            {order.order_number}
                                                            <ChevronRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-all -translate-x-1 group-hover/link:translate-x-0" />
                                                        </Link>
                                                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                            <Calendar className="h-2.5 w-2.5" />
                                                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                            <User className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700">{order.customer_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 text-[10px] px-2 py-0 capitalize">
                                                                {order.current_status.replace(/_/g, ' ')}
                                                            </Badge>
                                                            {order.is_priority && (
                                                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[9px] px-1.5 py-0 flex items-center gap-0.5">
                                                                    <Zap className="h-2 w-2 fill-white" />
                                                                    PRIORITY
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            <Briefcase className="h-2.5 w-2.5" />
                                                            {order.service_name}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${aging.style}`}>
                                                            {aging.label}
                                                        </span>
                                                        <div className="text-[10px] text-slate-500 font-mono pl-1">
                                                            {formatDuration(order.total_aging_hours)} dari pembuatan
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-4 text-right">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        Rp {order.estimated_price?.toLocaleString('id-ID')}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
