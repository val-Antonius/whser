'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Download, TrendingUp, Trash2, Package, Calendar, Clock, Activity, AlertCircle } from "lucide-react";

export default function InventoryUsageReportPage() {
    const [usageData, setUsageData] = useState([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchUsageReport();
    }, [startDate, endDate]);

    const fetchUsageReport = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(`/api/reports/inventory-usage?${params.toString()}`);
            if (!response.ok) throw new Error('Gagal mengambil laporan penggunaan');

            const data = await response.json();
            setUsageData(data.usage_data);
            setSummary(data.summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-slate-800 tracking-tight">Laporan Penggunaan Inventori</h1>
                        <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">Pantau konsumsi barang & efisiensi</p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-full font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        <span>Cetak Laporan</span>
                    </button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl border border-blue-100">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Item</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{summary.total_items}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl border border-emerald-100">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Terpakai</p>
                                    <h3 className="text-2xl font-bold text-slate-800">
                                        {parseFloat(summary.total_consumed || 0).toFixed(1)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
                                    <Trash2 className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Limbah</p>
                                    <h3 className="text-2xl font-bold text-slate-800">
                                        {parseFloat(summary.total_wasted || 0).toFixed(1)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-sky-50 text-sky-500 rounded-2xl border border-sky-100">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Pesanan Selesai</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{summary.total_orders}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white/60 backdrop-blur-sm border border-white/60 p-6 rounded-3xl mb-8 shadow-sm">
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Filter Rentang Waktu
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Dari Tanggal</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white/80 border-slate-200 rounded-xl h-11 focus:ring-sky-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Sampai Tanggal</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-white/80 border-slate-200 rounded-xl h-11 focus:ring-sky-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-rose-50/50 backdrop-blur-sm border border-rose-100 rounded-2xl text-rose-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                        </div>
                    )}

                    {/* Table Card */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-3xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-sky-500" />
                                Detail Performa Barang
                            </h2>
                            {!loading && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-500 font-mono text-[10px] px-2 py-0.5 border-slate-100 uppercase tracking-tighter">
                                    {usageData.length} records
                                </Badge>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                                        <TableHead className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Barang</TableHead>
                                        <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Kategori</TableHead>
                                        <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Terpakai</TableHead>
                                        <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Limbah</TableHead>
                                        <TableHead className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Order</TableHead>
                                        <TableHead className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rerata / Order</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                                                    <span className="text-sm font-medium text-slate-400">Menghitung data...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : usageData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-24 text-center text-slate-400 italic">
                                                Tidak ada data penggunaan untuk periode ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        usageData.map((item: any) => (
                                            <TableRow key={item.item_id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                                                <TableCell className="px-8 py-4">
                                                    <div className="font-bold text-slate-800">{item.item_name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase">{item.item_code}</div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <Badge variant="outline" className="text-[10px] font-bold text-slate-400 uppercase px-2 py-0.5 border-slate-100 rounded-lg">
                                                        {item.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-right font-bold text-slate-700">
                                                    {parseFloat(item.total_consumed || 0).toFixed(2)} <span className="text-[10px] font-normal text-slate-400 uppercase ml-0.5">{item.unit_of_measure}</span>
                                                </TableCell>
                                                <TableCell className={`px-4 py-4 text-right font-bold ${parseFloat(item.total_wasted) > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    {parseFloat(item.total_wasted || 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-right text-slate-600 font-medium">
                                                    {item.order_count}
                                                </TableCell>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {parseFloat(item.avg_consumption_per_order || 0).toFixed(2)}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 uppercase font-medium">{item.unit_of_measure} / order</span>
                                                    </div>
                                                </td>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
