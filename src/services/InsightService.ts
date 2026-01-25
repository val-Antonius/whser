// ============================================================================
// INSIGHT SERVICE
// ============================================================================
// Purpose: Manage insights (manual and LLM-generated)
// Phase: 3.4 - Manual Insight Creation
// ============================================================================

import { query, transaction } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Insight {
    id: number;
    snapshot_id: number;
    statement: string;
    severity: 'normal' | 'attention' | 'critical';
    metrics_involved: string[];
    generated_by: 'system' | 'llm' | 'manual';
    llm_confidence: number | null;
    is_actionable: boolean;
    created_at: string;
    created_by: number | null;
}

interface InsightRow extends RowDataPacket {
    id: number;
    snapshot_id: number;
    statement: string;
    severity: 'normal' | 'attention' | 'critical';
    metrics_involved: string;
    generated_by: 'system' | 'llm' | 'manual';
    llm_confidence: number | null;
    is_actionable: number;
    created_at: string;
    created_by: number | null;
}

export interface CreateInsightInput {
    snapshot_id: number;
    statement: string;
    severity: 'normal' | 'attention' | 'critical';
    metrics_involved: string[];
    is_actionable: boolean;
    created_by: number;
}

export interface UpdateInsightInput {
    statement?: string;
    severity?: 'normal' | 'attention' | 'critical';
    metrics_involved?: string[];
    is_actionable?: boolean;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateInsightInput(input: CreateInsightInput): { valid: boolean; error?: string } {
    if (!input.statement || input.statement.trim().length < 10) {
        return { valid: false, error: 'Pernyataan wawasan harus minimal 10 karakter' };
    }

    if (input.statement.length > 1000) {
        return { valid: false, error: 'Pernyataan wawasan maksimal 1000 karakter' };
    }

    if (!input.snapshot_id || input.snapshot_id <= 0) {
        return { valid: false, error: 'Snapshot harus dipilih' };
    }

    if (!['normal', 'attention', 'critical'].includes(input.severity)) {
        return { valid: false, error: 'Tingkat keparahan tidak valid' };
    }

    if (!input.metrics_involved || input.metrics_involved.length === 0) {
        return { valid: false, error: 'Minimal satu metrik harus dipilih' };
    }

    return { valid: true };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new insight
 */
export async function createInsight(input: CreateInsightInput): Promise<{ success: boolean; data?: Insight; error?: string }> {
    // Validate input
    const validation = validateInsightInput(input);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    try {
        const result = await query<ResultSetHeader>(
            `INSERT INTO insights (
                snapshot_id,
                statement,
                severity,
                metrics_involved,
                generated_by,
                is_actionable,
                created_by
            ) VALUES (?, ?, ?, ?, 'manual', ?, ?)`,
            [
                input.snapshot_id,
                input.statement,
                input.severity,
                JSON.stringify(input.metrics_involved),
                input.is_actionable ? 1 : 0,
                input.created_by
            ]
        );

        const insertId = (result as unknown as ResultSetHeader).insertId;

        // Fetch the created insight
        const createdInsight = await getInsightById(insertId);

        return { success: true, data: createdInsight.data };
    } catch (error) {
        console.error('Error creating insight:', error);
        return { success: false, error: 'Gagal membuat wawasan' };
    }
}

/**
 * Get all insights with optional filtering
 */
export async function getAllInsights(filters?: {
    snapshotId?: number;
    severity?: string;
    isActionable?: boolean;
}): Promise<{ success: boolean; data?: Insight[]; error?: string }> {
    try {
        let sql = `
            SELECT 
                i.*,
                ds.snapshot_name,
                ds.period_start,
                ds.period_end
            FROM insights i
            JOIN data_snapshots ds ON i.snapshot_id = ds.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters?.snapshotId) {
            sql += ' AND i.snapshot_id = ?';
            params.push(filters.snapshotId);
        }

        if (filters?.severity) {
            sql += ' AND i.severity = ?';
            params.push(filters.severity);
        }

        if (filters?.isActionable !== undefined) {
            sql += ' AND i.is_actionable = ?';
            params.push(filters.isActionable ? 1 : 0);
        }

        sql += ' ORDER BY i.created_at DESC';

        const rows = await query<InsightRow>(sql, params);

        const insights: Insight[] = rows.map(row => ({
            id: row.id,
            snapshot_id: row.snapshot_id,
            statement: row.statement,
            severity: row.severity,
            metrics_involved: JSON.parse(row.metrics_involved),
            generated_by: row.generated_by,
            llm_confidence: row.llm_confidence,
            is_actionable: Boolean(row.is_actionable),
            created_at: row.created_at,
            created_by: row.created_by
        }));

        return { success: true, data: insights };
    } catch (error) {
        console.error('Error fetching insights:', error);
        return { success: false, error: 'Gagal mengambil wawasan' };
    }
}

/**
 * Get insight by ID
 */
export async function getInsightById(id: number): Promise<{ success: boolean; data?: Insight; error?: string }> {
    try {
        const rows = await query<InsightRow>(
            `SELECT * FROM insights WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return { success: false, error: 'Wawasan tidak ditemukan' };
        }

        const row = rows[0];
        const insight: Insight = {
            id: row.id,
            snapshot_id: row.snapshot_id,
            statement: row.statement,
            severity: row.severity,
            metrics_involved: JSON.parse(row.metrics_involved),
            generated_by: row.generated_by,
            llm_confidence: row.llm_confidence,
            is_actionable: Boolean(row.is_actionable),
            created_at: row.created_at,
            created_by: row.created_by
        };

        return { success: true, data: insight };
    } catch (error) {
        console.error('Error fetching insight:', error);
        return { success: false, error: 'Gagal mengambil wawasan' };
    }
}

/**
 * Update an insight
 */
export async function updateInsight(
    id: number,
    input: UpdateInsightInput
): Promise<{ success: boolean; data?: Insight; error?: string }> {
    try {
        const updates: string[] = [];
        const params: any[] = [];

        if (input.statement !== undefined) {
            if (input.statement.trim().length < 10) {
                return { success: false, error: 'Pernyataan wawasan harus minimal 10 karakter' };
            }
            updates.push('statement = ?');
            params.push(input.statement);
        }

        if (input.severity !== undefined) {
            updates.push('severity = ?');
            params.push(input.severity);
        }

        if (input.metrics_involved !== undefined) {
            if (input.metrics_involved.length === 0) {
                return { success: false, error: 'Minimal satu metrik harus dipilih' };
            }
            updates.push('metrics_involved = ?');
            params.push(JSON.stringify(input.metrics_involved));
        }

        if (input.is_actionable !== undefined) {
            updates.push('is_actionable = ?');
            params.push(input.is_actionable ? 1 : 0);
        }

        if (updates.length === 0) {
            return { success: false, error: 'Tidak ada perubahan' };
        }

        params.push(id);

        await query(
            `UPDATE insights SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const updatedInsight = await getInsightById(id);
        return { success: true, data: updatedInsight.data };
    } catch (error) {
        console.error('Error updating insight:', error);
        return { success: false, error: 'Gagal memperbarui wawasan' };
    }
}

/**
 * Delete an insight
 */
export async function deleteInsight(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        await query('DELETE FROM insights WHERE id = ?', [id]);
        return { success: true };
    } catch (error) {
        console.error('Error deleting insight:', error);
        return { success: false, error: 'Gagal menghapus wawasan' };
    }
}
