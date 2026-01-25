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
                sct.id,
                sct.service_id,
                sct.inventory_item_id,
                sct.estimated_quantity, 
                sct.unit,              
                s.service_name,
                ii.item_name,
                ii.item_code,
                ii.unit_of_measure as item_unit
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

// POST /api/inventory/consumption-templates - Create or Update Service Recipe (Batch)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { service_id, items } = body;

        // Expect items to be an array: { inventory_item_id, estimated_quantity, unit }[]
        if (!service_id || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Invalid request format. Service ID and items array required.' },
                { status: 400 }
            );
        }

        // Validate items
        for (const item of items) {
            if (!item.inventory_item_id || !item.estimated_quantity || !item.unit) {
                return NextResponse.json(
                    { error: 'Each item must have inventory_item_id, quantity, and unit.' },
                    { status: 400 }
                );
            }
        }

        // Transaction: Delete existing -> Insert new
        await pool.query('START TRANSACTION');

        try {
            // 1. Delete existing templates for this service
            await pool.query(
                'DELETE FROM service_consumption_templates WHERE service_id = ?',
                [service_id]
            );

            // 2. Insert new templates
            if (items.length > 0) {
                const values = items.map((item: any) => [
                    service_id,
                    item.inventory_item_id,
                    item.estimated_quantity,
                    item.unit
                ]);

                // Flatten for bulk insert
                const flattenedValues = values.reduce((acc: any[], val: any[]) => acc.concat(val), []);
                const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');

                await pool.query(
                    `INSERT INTO service_consumption_templates 
                    (service_id, inventory_item_id, estimated_quantity, unit)
                    VALUES ${placeholders}`,
                    flattenedValues
                );
            }

            await pool.query('COMMIT');

            return NextResponse.json({
                message: 'Service recipe updated successfully',
                count: items.length
            });

        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }

    } catch (error) {
        console.error('Error updating consumption template:', error);
        return NextResponse.json(
            { error: 'Failed to update consumption template' },
            { status: 500 }
        );
    }
}
