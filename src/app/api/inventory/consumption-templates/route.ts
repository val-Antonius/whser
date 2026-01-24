import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/inventory/consumption-templates - List consumption templates
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('service_id');

        let query = `
            SELECT 
                sct.*,
                s.service_name,
                ii.item_name,
                ii.item_code
            FROM service_consumption_templates sct
            JOIN services s ON sct.service_id = s.id
            JOIN inventory_items ii ON sct.inventory_item_id = ii.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (serviceId) {
            query += ' AND sct.service_id = ?';
            params.push(parseInt(serviceId));
        }

        query += ' ORDER BY s.service_name, ii.item_name';

        const [templates] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Error fetching consumption templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch consumption templates' },
            { status: 500 }
        );
    }
}

// POST /api/inventory/consumption-templates - Create consumption template
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { service_id, inventory_item_id, estimated_quantity, unit, notes } = body;

        // Validate required fields
        if (!service_id || !inventory_item_id || !estimated_quantity || !unit) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if template already exists
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM service_consumption_templates WHERE service_id = ? AND inventory_item_id = ?',
            [service_id, inventory_item_id]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Template already exists for this service and item combination' },
                { status: 409 }
            );
        }

        // Insert template
        const [result] = await pool.query(
            `INSERT INTO service_consumption_templates 
            (service_id, inventory_item_id, estimated_quantity, unit, notes)
            VALUES (?, ?, ?, ?, ?)`,
            [service_id, inventory_item_id, estimated_quantity, unit, notes || null]
        );

        return NextResponse.json({
            message: 'Template created successfully',
            id: (result as any).insertId
        });
    } catch (error) {
        console.error('Error creating consumption template:', error);
        return NextResponse.json(
            { error: 'Failed to create consumption template' },
            { status: 500 }
        );
    }
}
