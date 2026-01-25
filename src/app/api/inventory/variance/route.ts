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

        // 1. Fetch Order Variances (Existing)
        let orderQuery = `
            SELECT 
                iv.id,
                iv.status,
                iv.severity,
                iv.created_at,
                iv.variance_amount,
                iv.variance_percentage,
                iv.investigation_notes,
                iv.resolution_notes,
                o.order_number as reference_number,
                oic.estimated_quantity as expected_qty,
                oic.actual_quantity as actual_qty,
                oic.unit,
                ii.item_name,
                ii.item_code,
                'order_consumption' as source
            FROM inventory_variance iv
            JOIN order_inventory_consumption oic ON iv.consumption_id = oic.id
            JOIN orders o ON oic.order_id = o.id
            JOIN inventory_items ii ON oic.inventory_item_id = ii.id
            WHERE 1=1
        `;

        const orderParams: any[] = [];
        if (status) {
            orderQuery += ' AND iv.status = ?';
            orderParams.push(status);
        }
        if (severity) {
            orderQuery += ' AND iv.severity = ?';
            orderParams.push(severity);
        }
        orderQuery += ' ORDER BY iv.created_at DESC LIMIT ?';
        orderParams.push(limit);

        // 2. Fetch Stock Opname Adjustments
        // Note: Adjustments are always 'resolved' effectively, but we map them for visibility
        let opnameQuery = `
            SELECT 
                it.id,
                'resolved' as status, -- Adjustments are effectively resolved
                it.transaction_date as created_at,
                it.quantity as variance_amount, -- This is the absolute variance in transactions table usually, but we need signed.
                -- Let's recalculate signed variance: stock_after - stock_before
                (it.stock_after - it.stock_before) as signed_variance,
                it.stock_before as expected_qty,
                it.stock_after as actual_qty,
                it.notes as resolution_notes,
                it.reference_number,
                ii.item_name,
                ii.item_code,
                ii.unit_of_measure as unit,
                'stock_opname' as source
            FROM inventory_transactions it
            JOIN inventory_items ii ON it.inventory_item_id = ii.id
            WHERE it.transaction_type = 'adjustment'
        `;

        const opnameParams: any[] = [];
        // Apply filters conceptually where possible
        if (status && status !== 'resolved') {
            // If filtering for pending/investigating, opnames shouldn't show up (they are resolved)
            opnameQuery += ' AND 1=0';
        }

        opnameQuery += ' ORDER BY it.transaction_date DESC LIMIT ?';
        opnameParams.push(limit);

        // Execute queries
        const [orderVariances] = await pool.query<RowDataPacket[]>(orderQuery, orderParams);
        const [opnameAdjustments] = await pool.query<RowDataPacket[]>(opnameQuery, opnameParams);

        // Normalize and Merge
        const normalizedOrders = orderVariances.map((v: any) => ({
            id: `ord-${v.id}`,
            original_id: v.id,
            source: 'order_consumption',
            status: v.status,
            severity: v.severity,
            created_at: v.created_at,
            item_name: v.item_name,
            item_code: v.item_code,
            reference_number: v.reference_number,
            expected_qty: Number(v.expected_qty),
            actual_qty: Number(v.actual_qty),
            variance_qty: Number(v.actual_qty) - Number(v.expected_qty),
            variance_percent: Number(v.variance_percentage),
            unit: v.unit,
            investigation_notes: v.investigation_notes,
            resolution_notes: v.resolution_notes
        }));

        const normalizedOpnames = opnameAdjustments.map((v: any) => {
            const variance = Number(v.signed_variance);
            const expected = Number(v.expected_qty);
            // Avoid division by zero
            const percent = expected !== 0 ? (variance / expected) * 100 : 100;

            // Calculate severity based on percent
            let calculatedSeverity = 'low';
            const absPercent = Math.abs(percent);
            if (absPercent > 20) calculatedSeverity = 'critical';
            else if (absPercent > 10) calculatedSeverity = 'high';
            else if (absPercent > 5) calculatedSeverity = 'medium';

            if (severity && calculatedSeverity !== severity) return null;

            return {
                id: `opn-${v.id}`,
                original_id: v.id,
                source: 'stock_opname',
                status: 'resolved',
                severity: calculatedSeverity, // Calculated dynamically
                created_at: v.created_at,
                item_name: v.item_name,
                item_code: v.item_code,
                reference_number: v.reference_number || 'Penyesuaian Manual',
                expected_qty: expected,
                actual_qty: Number(v.actual_qty),
                variance_qty: variance,
                variance_percent: percent,
                unit: v.unit,
                investigation_notes: null,
                resolution_notes: v.resolution_notes
            };
        }).filter(Boolean); // Remove filtered out items

        // sort merged array by date desc
        const allVariances = [...normalizedOrders, ...normalizedOpnames].sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, limit);

        // Summary Statistics (Approximation based on fetched data, ideally should be separate count queries)
        const summary = {
            total: allVariances.length,
            pending: allVariances.filter(v => v.status === 'pending').length,
            investigating: allVariances.filter(v => v.status === 'investigating').length,
            resolved: allVariances.filter(v => v.status === 'resolved').length,
            critical: allVariances.filter(v => v.severity === 'critical').length,
            high: allVariances.filter(v => v.severity === 'high').length
        };

        return NextResponse.json({ variances: allVariances, summary });
    } catch (error) {
        console.error('Error fetching variance records:', error);
        return NextResponse.json(
            { error: 'Failed to fetch variance records' },
            { status: 500 }
        );
    }
}
