// ============================================================================
// INVENTORY TRANSACTIONS API
// ============================================================================
// Purpose: API endpoints for recording stock movements
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { ApiResponse, InventoryTransactionType } from '@/types';

/**
 * GET /api/inventory/transactions
 * Get inventory transaction history
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const itemId = searchParams.get('item_id');
        const limit = parseInt(searchParams.get('limit') || '50');

        let sql = `
      SELECT 
        it.*,
        ii.item_name,
        ii.item_code,
        u.name as created_by_name
      FROM inventory_transactions it
      JOIN inventory_items ii ON it.inventory_item_id = ii.id
      LEFT JOIN users u ON it.created_by = u.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (itemId) {
            sql += ' AND it.inventory_item_id = ?';
            params.push(parseInt(itemId));
        }

        sql += ' ORDER BY it.transaction_date DESC LIMIT ?';
        params.push(limit);

        const transactions = await query<any>(sql, params);

        return NextResponse.json<ApiResponse<any[]>>({
            success: true,
            data: transactions,
        });
    } catch (error) {
        console.error('Error fetching inventory transactions:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch inventory transactions',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/inventory/transactions
 * Record a new inventory transaction (stock in/out)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            inventory_item_id,
            transaction_type,
            quantity,
            unit_cost,
            reference_number,
            notes,
            created_by,
        } = body;

        // Validation
        if (!inventory_item_id || !transaction_type || !quantity || !created_by) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing required fields: inventory_item_id, transaction_type, quantity, created_by',
                },
                { status: 400 }
            );
        }

        if (quantity <= 0) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Quantity must be greater than 0',
                },
                { status: 400 }
            );
        }

        // Get current stock
        const [item] = await query<any>(
            'SELECT current_stock FROM inventory_items WHERE id = ?',
            [inventory_item_id]
        );

        if (!item) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Inventory item not found',
                },
                { status: 404 }
            );
        }

        // Calculate new stock
        const currentStock = parseFloat(item.current_stock);
        let newStock: number;

        if (transaction_type === InventoryTransactionType.STOCK_IN ||
            transaction_type === InventoryTransactionType.ADJUSTMENT_IN) {
            newStock = currentStock + quantity;
        } else if (transaction_type === InventoryTransactionType.STOCK_OUT ||
            transaction_type === InventoryTransactionType.ADJUSTMENT_OUT ||
            transaction_type === InventoryTransactionType.CONSUMPTION) {
            newStock = currentStock - quantity;
            if (newStock < 0) {
                return NextResponse.json<ApiResponse>(
                    {
                        success: false,
                        error: 'Insufficient stock. Current stock: ' + currentStock,
                    },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Invalid transaction type',
                },
                { status: 400 }
            );
        }

        // Create transaction in database transaction
        const result = await transaction(async (conn) => {
            // Insert transaction record
            const [txResult]: any = await conn.execute(
                `INSERT INTO inventory_transactions 
         (inventory_item_id, transaction_type, quantity, unit_cost, stock_before, stock_after, 
          reference_number, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    inventory_item_id,
                    transaction_type,
                    quantity,
                    unit_cost || null,
                    currentStock,
                    newStock,
                    reference_number || null,
                    notes || null,
                    created_by,
                ]
            );

            // Note: The trigger will automatically update inventory_items.current_stock
            // But we'll do it explicitly here for clarity
            await conn.execute(
                'UPDATE inventory_items SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStock, inventory_item_id]
            );

            return txResult.insertId;
        });

        // Fetch the created transaction
        const [newTransaction] = await query<any>(
            `SELECT 
        it.*,
        ii.item_name,
        ii.item_code
       FROM inventory_transactions it
       JOIN inventory_items ii ON it.inventory_item_id = ii.id
       WHERE it.id = ?`,
            [result]
        );

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: newTransaction,
            message: 'Inventory transaction recorded successfully',
        });
    } catch (error) {
        console.error('Error creating inventory transaction:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to create inventory transaction',
            },
            { status: 500 }
        );
    }
}
