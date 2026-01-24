import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/reports/cost-attribution - Get cost attribution by order
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('order_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = `
            SELECT 
                o.id as order_id,
                o.order_number,
                o.estimated_price,
                c.name as customer_name,
                s.service_name,
                SUM(it.cost_per_unit * it.quantity) as total_inventory_cost,
                COUNT(DISTINCT it.inventory_item_id) as items_used,
                o.created_at
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN services s ON o.service_id = s.id
            LEFT JOIN inventory_transactions it ON o.id = it.attributed_order_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (orderId) {
            query += ' AND o.id = ?';
            params.push(parseInt(orderId));
        }

        if (startDate) {
            query += ' AND o.created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND o.created_at <= ?';
            params.push(endDate);
        }

        query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ?';
        params.push(limit);

        const [costData] = await pool.query<RowDataPacket[]>(query, params);

        // If specific order requested, get detailed breakdown
        let itemBreakdown = null;
        if (orderId) {
            const [items] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    ii.item_name,
                    ii.item_code,
                    it.quantity,
                    it.cost_per_unit,
                    (it.quantity * it.cost_per_unit) as total_cost,
                    it.transaction_date
                FROM inventory_transactions it
                JOIN inventory_items ii ON it.inventory_item_id = ii.id
                WHERE it.attributed_order_id = ?
                ORDER BY total_cost DESC`,
                [parseInt(orderId)]
            );
            itemBreakdown = items;
        }

        // Calculate summary
        const summary = {
            total_orders: costData.length,
            total_inventory_cost: costData.reduce((sum: number, order: any) =>
                sum + parseFloat(order.total_inventory_cost || 0), 0),
            avg_cost_per_order: costData.length > 0
                ? costData.reduce((sum: number, order: any) =>
                    sum + parseFloat(order.total_inventory_cost || 0), 0) / costData.length
                : 0
        };

        return NextResponse.json({
            cost_data: costData,
            item_breakdown: itemBreakdown,
            summary
        });
    } catch (error) {
        console.error('Error generating cost attribution report:', error);
        return NextResponse.json(
            { error: 'Failed to generate cost attribution report' },
            { status: 500 }
        );
    }
}
