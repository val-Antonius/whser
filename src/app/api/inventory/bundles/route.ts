import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET /api/inventory/bundles - List all bundles
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active_only') === 'true';

        let query = `
            SELECT 
                ib.*,
                COUNT(bi.id) as item_count
            FROM inventory_bundles ib
            LEFT JOIN bundle_items bi ON ib.id = bi.bundle_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (activeOnly) {
            query += ' AND ib.is_active = TRUE';
        }

        query += ' GROUP BY ib.id ORDER BY ib.created_at DESC';

        const [bundles] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ bundles });
    } catch (error) {
        console.error('Error fetching bundles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bundles' },
            { status: 500 }
        );
    }
}

// POST /api/inventory/bundles - Create new bundle
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bundle_name, bundle_code, description } = body;

        if (!bundle_name || !bundle_code) {
            return NextResponse.json(
                { error: 'Bundle name and code are required' },
                { status: 400 }
            );
        }

        // Check if bundle code already exists
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM inventory_bundles WHERE bundle_code = ?',
            [bundle_code]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Bundle code already exists' },
                { status: 409 }
            );
        }

        const [result] = await pool.query(
            `INSERT INTO inventory_bundles (bundle_name, bundle_code, description, created_by)
            VALUES (?, ?, ?, ?)`,
            [bundle_name, bundle_code, description || null, 1] // TODO: Get user from session
        );

        return NextResponse.json({
            message: 'Bundle created successfully',
            id: (result as any).insertId
        });
    } catch (error) {
        console.error('Error creating bundle:', error);
        return NextResponse.json(
            { error: 'Failed to create bundle' },
            { status: 500 }
        );
    }
}
