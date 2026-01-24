import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { validateAuthorizationCode } from '@/lib/authorization';

// GET /api/inventory/waste - List waste events
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const wasteType = searchParams.get('waste_type');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = `
            SELECT 
                iw.*,
                ii.item_name,
                ii.item_code,
                u.name as reported_by_name
            FROM inventory_waste iw
            JOIN inventory_items ii ON iw.inventory_item_id = ii.id
            LEFT JOIN users u ON iw.reported_by = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (wasteType) {
            query += ' AND iw.waste_type = ?';
            params.push(wasteType);
        }

        query += ' ORDER BY iw.reported_at DESC LIMIT ?';
        params.push(limit);

        const [wasteEvents] = await pool.query<RowDataPacket[]>(query, params);

        // Calculate total cost impact
        const totalCostImpact = wasteEvents.reduce((sum: number, event: any) =>
            sum + parseFloat(event.cost_impact || 0), 0
        );

        return NextResponse.json({
            waste_events: wasteEvents,
            total_cost_impact: totalCostImpact
        });
    } catch (error) {
        console.error('Error fetching waste events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch waste events' },
            { status: 500 }
        );
    }
}

// POST /api/inventory/waste - Report waste event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { inventory_item_id, quantity, unit, waste_type, reason, authorization_code } = body;

        // Validate required fields
        if (!inventory_item_id || !quantity || !unit || !waste_type || !reason || !authorization_code) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate authorization
        if (!validateAuthorizationCode(authorization_code)) {
            return NextResponse.json(
                { error: 'Invalid authorization code' },
                { status: 403 }
            );
        }

        // Get current item cost
        const [items] = await pool.query<RowDataPacket[]>(
            'SELECT unit_cost FROM inventory_items WHERE id = ?',
            [inventory_item_id]
        );

        if (items.length === 0) {
            return NextResponse.json(
                { error: 'Inventory item not found' },
                { status: 404 }
            );
        }

        const costImpact = parseFloat(items[0].unit_cost || 0) * parseFloat(quantity);

        // Insert waste record
        const [result] = await pool.query(
            `INSERT INTO inventory_waste 
            (inventory_item_id, quantity, unit, waste_type, reason, cost_impact, reported_by, authorized_by, authorization_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [inventory_item_id, quantity, unit, waste_type, reason, costImpact, 1, 1, authorization_code]
        );

        return NextResponse.json({
            message: 'Waste reported successfully',
            id: (result as any).insertId,
            cost_impact: costImpact
        });
    } catch (error) {
        console.error('Error reporting waste:', error);
        return NextResponse.json(
            { error: 'Failed to report waste' },
            { status: 500 }
        );
    }
}
