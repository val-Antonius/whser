import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/sla-alerts - Get SLA alerts with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const alertType = searchParams.get('type');
        const acknowledged = searchParams.get('acknowledged');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = `
      SELECT 
        sa.*,
        o.order_number,
        o.current_status as order_status,
        c.name as customer_name
      FROM sla_alerts sa
      JOIN orders o ON sa.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (alertType) {
            query += ' AND sa.alert_type = ?';
            params.push(alertType);
        }

        if (acknowledged !== null) {
            query += ' AND sa.is_acknowledged = ?';
            params.push(acknowledged === 'true' ? 1 : 0);
        }

        query += ' ORDER BY sa.created_at DESC LIMIT ?';
        params.push(limit);

        const [alerts] = await pool.query<RowDataPacket[]>(query, params);

        // Group by alert type for summary
        const summary = {
            critical: alerts.filter(a => a.alert_type === 'critical' && !a.is_acknowledged).length,
            breached: alerts.filter(a => a.alert_type === 'breached' && !a.is_acknowledged).length,
            approaching: alerts.filter(a => a.alert_type === 'approaching' && !a.is_acknowledged).length,
            total_unacknowledged: alerts.filter(a => !a.is_acknowledged).length
        };

        return NextResponse.json({
            alerts,
            summary
        });
    } catch (error) {
        console.error('Error fetching SLA alerts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch SLA alerts' },
            { status: 500 }
        );
    }
}
