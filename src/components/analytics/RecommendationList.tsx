'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface Recommendation {
    id: number;
    title: string;
    action: string;
    category: 'sop' | 'staffing' | 'capacity' | 'pricing' | 'inventory' | 'other';
    urgency: 'low' | 'medium' | 'high';
    rationale: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    created_at: string;
    insight_statement?: string;
}

interface RecommendationListProps {
    recommendations: Recommendation[];
    onStatusUpdate: (id: number, status: string) => void;
}

export function RecommendationList({ recommendations, onStatusUpdate }: RecommendationListProps) {
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterUrgency, setFilterUrgency] = useState<string>('all');

    const filtered = recommendations.filter(rec => {
        if (filterStatus !== 'all' && rec.status !== filterStatus) return false;
        if (filterUrgency !== 'all' && rec.urgency !== filterUrgency) return false;
        return true;
    });

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'accepted': return <Clock className="h-5 w-5 text-blue-500" />;
            case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <AlertTriangle className="h-5 w-5 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Disetujui</SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                        <SelectItem value="rejected">Ditolak</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter Urgensi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Urgensi</SelectItem>
                        <SelectItem value="high">Tinggi</SelectItem>
                        <SelectItem value="medium">Sedang</SelectItem>
                        <SelectItem value="low">Rendah</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">Tidak ada rekomendasi yang sesuai filter</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((rec) => (
                        <Card key={rec.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className={getUrgencyColor(rec.urgency)}>
                                                {rec.urgency.toUpperCase()}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {rec.category}
                                            </Badge>
                                            <span className="text-sm text-gray-500">
                                                {new Date(rec.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                                            {rec.action}
                                        </h3>

                                        <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm text-gray-700">
                                            <span className="font-semibold">Rationale:</span> {rec.rationale}
                                        </div>

                                        {rec.insight_statement && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <ArrowRight className="h-3 w-3" />
                                                Based on insight: "{rec.insight_statement}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        <div className="flex items-center justify-end gap-2 mb-2 font-medium text-sm">
                                            {getStatusIcon(rec.status)}
                                            <span className="capitalize">{rec.status}</span>
                                        </div>

                                        {rec.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                                    onClick={() => onStatusUpdate(rec.id, 'accepted')}
                                                >
                                                    Setujui
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => onStatusUpdate(rec.id, 'rejected')}
                                                >
                                                    Tolak
                                                </Button>
                                            </>
                                        )}

                                        {rec.status === 'accepted' && (
                                            <Button
                                                size="sm"
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={() => onStatusUpdate(rec.id, 'completed')}
                                            >
                                                Tandai Selesai
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
