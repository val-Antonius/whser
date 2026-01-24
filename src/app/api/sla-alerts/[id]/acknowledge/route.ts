import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// POST /api/sla-alerts/[id]/acknowledge - Acknowledge an SLA alert
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const alertId = parseInt(id);

        if (isNaN(alertId)) {
            return NextResponse.json(
                { error: 'Invalid alert ID' },
                { status: 400 }
            );
        }

        // Verify alert exists
        const [alerts] = await pool.query<RowDataPacket[]>(
            'SELECT id, is_acknowledged FROM sla_alerts WHERE id = ?',
            [alertId]
        );

        if (alerts.length === 0) {
            return NextResponse.json(
                { error: 'Alert not found' },
                { status: 404 }
            );
        }

        if (alerts[0].is_acknowledged) {
            return NextResponse.json(
                { error: 'Alert already acknowledged' },
                { status: 400 }
            );
        }

        // Acknowledge the alert
        await pool.query(
            `UPDATE sla_alerts 
      SET is_acknowledged = TRUE,
          acknowledged_by = ?,
          acknowledged_at = NOW()
      WHERE id = ?`,
            [1, alertId] // TODO: Get actual user ID from session
        );

        return NextResponse.json({
            message: 'Alert acknowledged successfully'
        });
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        return NextResponse.json(
            { error: 'Failed to acknowledge alert' },
            { status: 500 }
        );
    }
}
