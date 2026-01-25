// ============================================================================
// INVENTORY ITEMS API
// ============================================================================
// Purpose: API endpoints for inventory item management
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

/**
 * GET /api/inventory
 * Get all inventory items with current stock levels
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get('category');
        const lowStockOnly = searchParams.get('low_stock') === 'true';

        let sql = `
      SELECT 
        id,
        item_code,
        item_name,
        category,
        unit_of_measure,
        current_stock,
        minimum_stock,
        unit_cost,
        is_active,
        created_at,
        updated_at
      FROM inventory_items
      WHERE 1=1
    `;
        const params: any[] = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (lowStockOnly) {
            sql += ' AND current_stock <= minimum_stock';
        }

        sql += ' ORDER BY item_name';

        const items = await query<any>(sql, params);

        // Add stock status to each item
        const itemsWithStatus = items.map(item => ({
            ...item,
            stock_status: item.current_stock <= 0 ? 'out_of_stock' :
                item.current_stock <= item.minimum_stock ? 'low_stock' : 'in_stock',
            stock_percentage: item.minimum_stock > 0
                ? Math.round((item.current_stock / (item.minimum_stock * 2)) * 100)
                : 100,
        }));

        return NextResponse.json<ApiResponse<any[]>>({
            success: true,
            data: itemsWithStatus,
        });
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch inventory items',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/inventory
 * Create new inventory item
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            item_code,
            item_name,
            category,
            unit_of_measure,
            current_stock,
            minimum_stock,
            unit_cost
        } = body;

        // Validate required fields
        if (!item_code || !item_name || !category || !unit_of_measure) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'Field wajib: item_code, item_name, category, unit_of_measure'
            }, { status: 400 });
        }

        // Check if item_code already exists
        const existing = await query<any>(
            'SELECT id FROM inventory_items WHERE item_code = ?',
            [item_code]
        );

        if (existing.length > 0) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: 'Kode barang sudah digunakan'
            }, { status: 409 });
        }

        // Insert new item
        const result = await query(
            `INSERT INTO inventory_items 
            (item_code, item_name, category, unit_of_measure, current_stock, minimum_stock, unit_cost, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                item_code,
                item_name,
                category,
                unit_of_measure,
                current_stock || 0,
                minimum_stock || 0,
                unit_cost || 0
            ]
        );

        return NextResponse.json<ApiResponse>({
            success: true,
            data: { id: (result as any).insertId },
            message: 'Barang inventory berhasil ditambahkan'
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Gagal menambahkan barang inventory'
        }, { status: 500 });
    }
}
