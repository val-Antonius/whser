'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface CreateRecommendationDialogProps {
    onRecommendationCreated: () => void;
}

export function CreateRecommendationDialog({ onRecommendationCreated }: CreateRecommendationDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        action: '',
        category: 'sop',
        urgency: 'medium',
        rationale: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/analytics/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    generated_by: 'manual'
                })
            });

            if (response.ok) {
                setOpen(false);
                setFormData({
                    action: '',
                    category: 'sop',
                    urgency: 'medium',
                    rationale: ''
                });
                onRecommendationCreated();
            } else {
                console.error('Failed to create recommendation');
            }
        } catch (error) {
            console.error('Error creating recommendation:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Buat Rekomendasi Manual
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Buat Rekomendasi Manual</DialogTitle>
                    <DialogDescription>
                        Tambahkan rekomendasi baru secara manual untuk perbaikan sistem atau operasional.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="action" className="text-right">
                                Tindakan
                            </Label>
                            <Input
                                id="action"
                                value={formData.action}
                                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                className="col-span-3"
                                placeholder="Contoh: Perbarui SOP Setrika"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Kategori
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sop">SOP</SelectItem>
                                    <SelectItem value="staffing">Kepegawaian</SelectItem>
                                    <SelectItem value="capacity">Kapasitas</SelectItem>
                                    <SelectItem value="pricing">Harga</SelectItem>
                                    <SelectItem value="inventory">Inventaris</SelectItem>
                                    <SelectItem value="other">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="urgency" className="text-right">
                                Urgensi
                            </Label>
                            <Select
                                value={formData.urgency}
                                onValueChange={(val) => setFormData({ ...formData, urgency: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Pilih urgensi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Rendah</SelectItem>
                                    <SelectItem value="medium">Sedang</SelectItem>
                                    <SelectItem value="high">Tinggi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rationale" className="text-right">
                                Alasan
                            </Label>
                            <Textarea
                                id="rationale"
                                value={formData.rationale}
                                onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                                className="col-span-3"
                                placeholder="Mengapa tindakan ini diperlukan?"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Rekomendasi'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
