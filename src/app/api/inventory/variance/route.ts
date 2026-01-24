import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/inventory/variance - List variance records
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const severity = searchParams.get('severity');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = `
            SELECT 
                iv.*,
                oic.order_id,
                o.order_number,
                oic.estimated_quantity,
                oic.actual_quantity,
                oic.unit,
                ii.item_name,
                ii.item_code
            FROM inventory_variance iv
            JOIN order_inventory_consumption oic ON iv.consumption_id = oic.id
            JOIN orders o ON oic.order_id = o.id
            JOIN inventory_items ii ON oic.inventory_item_id = ii.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status) {
            query += ' AND iv.status = ?';
            params.push(status);
        }

        if (severity) {
            query += ' AND iv.severity = ?';
            params.push(severity);
        }

        query += ' ORDER BY iv.created_at DESC LIMIT ?';
        params.push(limit);

        const [variances] = await pool.query<RowDataPacket[]>(query, params);

        // Calculate summary statistics
        const summary = {
            total: variances.length,
            pending: variances.filter((v: any) => v.status === 'pending').length,
            investigating: variances.filter((v: any) => v.status === 'investigating').length,
            resolved: variances.filter((v: any) => v.status === 'resolved').length,
            critical: variances.filter((v: any) => v.severity === 'critical').length,
            high: variances.filter((v: any) => v.severity === 'high').length
        };

        return NextResponse.json({ variances, summary });
    } catch (error) {
        console.error('Error fetching variance records:', error);
        return NextResponse.json(
            { error: 'Failed to fetch variance records' },
            { status: 500 }
        );
    }
}
