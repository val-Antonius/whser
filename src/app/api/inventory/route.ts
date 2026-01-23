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
