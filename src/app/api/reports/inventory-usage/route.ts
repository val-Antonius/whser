import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/reports/inventory-usage - Get usage report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const itemId = searchParams.get('item_id');
        const serviceId = searchParams.get('service_id');

        let query = `
            SELECT 
                ii.id as item_id,
                ii.item_name,
                ii.item_code,
                ii.category,
                ii.unit_of_measure,
                SUM(CASE WHEN it.transaction_type = 'consumption' THEN it.quantity ELSE 0 END) as total_consumed,
                SUM(CASE WHEN it.transaction_type = 'stock_in' THEN it.quantity ELSE 0 END) as total_stocked,
                SUM(CASE WHEN it.transaction_type = 'waste' THEN it.quantity ELSE 0 END) as total_wasted,
                COUNT(DISTINCT it.order_id) as order_count,
                AVG(CASE WHEN it.transaction_type = 'consumption' THEN it.quantity ELSE NULL END) as avg_consumption_per_order
            FROM inventory_items ii
            LEFT JOIN inventory_transactions it ON ii.id = it.inventory_item_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (startDate) {
            query += ' AND it.transaction_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND it.transaction_date <= ?';
            params.push(endDate);
        }

        if (itemId) {
            query += ' AND ii.id = ?';
            params.push(parseInt(itemId));
        }

        query += ' GROUP BY ii.id ORDER BY total_consumed DESC';

        const [usageData] = await pool.query<RowDataPacket[]>(query, params);

        // Get service-specific usage if service_id provided
        let serviceUsage = null;
        if (serviceId) {
            const [serviceData] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    s.service_name,
                    ii.item_name,
                    COUNT(DISTINCT o.id) as order_count,
                    SUM(it.quantity) as total_consumed
                FROM orders o
                JOIN services s ON o.service_id = s.id
                JOIN inventory_transactions it ON o.id = it.order_id
                JOIN inventory_items ii ON it.inventory_item_id = ii.id
                WHERE s.id = ? AND it.transaction_type = 'consumption'
                GROUP BY s.id, ii.id`,
                [parseInt(serviceId)]
            );
            serviceUsage = serviceData;
        }

        // Calculate summary statistics
        const summary = {
            total_items: usageData.length,
            total_consumed: usageData.reduce((sum: number, item: any) =>
                sum + parseFloat(item.total_consumed || 0), 0),
            total_wasted: usageData.reduce((sum: number, item: any) =>
                sum + parseFloat(item.total_wasted || 0), 0),
            total_orders: usageData.reduce((sum: number, item: any) =>
                sum + parseInt(item.order_count || 0), 0)
        };

        return NextResponse.json({
            usage_data: usageData,
            service_usage: serviceUsage,
            summary
        });
    } catch (error) {
        console.error('Error generating usage report:', error);
        return NextResponse.json(
            { error: 'Failed to generate usage report' },
            { status: 500 }
        );
    }
}
