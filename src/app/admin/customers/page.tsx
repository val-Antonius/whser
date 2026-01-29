'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CustomerSegment } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, RefreshCw, Filter } from "lucide-react";

interface Customer {
    id: number;
    customer_number: string;
    name: string;
    phone: string;
    email: string;
    segment: string;
    is_active: boolean;
    created_at: string;
    last_order_date?: string;
    total_orders?: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/customers?limit=100');
            const data = await response.json();
            if (data.success) {
                setCustomers(data.data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.customer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

        // Segment filter
        const matchesSegment = segmentFilter === '' || customer.segment === segmentFilter;

        // Status filter
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && customer.is_active) ||
            (statusFilter === 'inactive' && !customer.is_active);

        return matchesSearch && matchesSegment && matchesStatus;
    });

    const getSegmentColor = (segment: string) => {
        const colors: Record<string, string> = {
            regular: 'bg-gray-100 text-gray-800',
            vip: 'bg-purple-100 text-purple-800',
            corporate: 'bg-blue-100 text-blue-800',
            dormitory: 'bg-green-100 text-green-800',
            hotel: 'bg-yellow-100 text-yellow-800',
        };
        return colors[segment] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div>
            <PageHeader
                title="Manajemen Pelanggan"
                description="Lihat dan kelola profil pelanggan"
                actions={
                    <Link href="/admin/pos">
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Pelanggan Baru (via POS)
                        </Button>
                    </Link>
                }
            />

            <div className="max-w-7xl mx-auto">
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Filter Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama, telepon, email, atau ID pelanggan..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Segment Filter */}
                            <div>
                                <Select
                                    value={segmentFilter}
                                    onValueChange={setSegmentFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Segmen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Segmen</SelectItem>
                                        <SelectItem value={CustomerSegment.REGULAR}>Regular</SelectItem>
                                        <SelectItem value={CustomerSegment.VIP}>VIP</SelectItem>
                                        <SelectItem value={CustomerSegment.CORPORATE}>Corporate</SelectItem>
                                        <SelectItem value={CustomerSegment.DORMITORY}>Dormitory</SelectItem>
                                        <SelectItem value={CustomerSegment.HOTEL}>Hotel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="bg-white/50 border-white/50 backdrop-blur-sm">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Hanya Aktif</SelectItem>
                                        <SelectItem value="inactive">Hanya Tidak Aktif</SelectItem>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                            <p>
                                Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchCustomers}
                                className="text-muted-foreground hover:text-foreground hover:bg-white/50"
                            >
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Refresh Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-xl border-white/50 shadow-sm">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">Memuat data pelanggan...</div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Tidak ada pelanggan ditemukan. {searchTerm && 'Coba ubah kriteria pencarian.'}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-slate-50/50">
                                        <TableHead className="pl-6">Pelanggan</TableHead>
                                        <TableHead>Kontak</TableHead>
                                        <TableHead>Segmen</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Bergabung</TableHead>
                                        <TableHead className="text-right pr-6">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.map((customer) => (
                                        <TableRow key={customer.id} className="hover:bg-sky-50/30 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 bg-gradient-to-br from-sky-100 to-blue-200 border-2 border-white ring-1 ring-sky-100">
                                                        <AvatarFallback className="text-sky-700 font-semibold bg-transparent">
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{customer.name}</div>
                                                        <div className="text-xs text-slate-500">{customer.customer_number}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-slate-700">{customer.phone || '-'}</div>
                                                <div className="text-xs text-slate-400">{customer.email || 'Tidak ada email'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`capitalize font-normal border-0 ${getSegmentColor(customer.segment)}`}>
                                                    {customer.segment}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={customer.is_active ? "default" : "secondary"} className={customer.is_active ? "bg-green-600 hover:bg-green-700" : ""}>
                                                    {customer.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(customer.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Link href={`/admin/customers/${customer.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                                        Detail
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
