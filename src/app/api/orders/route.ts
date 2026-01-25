// ============================================================================
// ORDERS API ROUTES
// ============================================================================
// Purpose: API endpoints for order creation and management
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/db';
import {
    Order,
    OrderStatus,
    PaymentStatus,
    OrderPriority,
    UnitType,
    ApiResponse
} from '@/types';

/**
 * GET /api/orders
 * Get orders with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const customerId = searchParams.get('customer_id');
        const limit = parseInt(searchParams.get('limit') || '50');

        let sql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        s.service_name,
        s.service_type
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN services s ON o.service_id = s.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (status) {
            sql += ' AND o.current_status = ?';
            params.push(status);
        }

        if (customerId) {
            sql += ' AND o.customer_id = ?';
            params.push(parseInt(customerId));
        }

        sql += ' ORDER BY o.created_at DESC LIMIT ?';
        params.push(limit);

        const orders = await query<any>(sql, params);

        return NextResponse.json<ApiResponse<any[]>>({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch orders',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders
 * Create a new order
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            customer_id,
            service_id,
            estimated_weight,
            quantity,
            unit_type,
            priority,
            payment_status,
            paid_amount,
            payment_method,
            special_instructions,
            created_by,
        } = body;

        // Validation
        if (!customer_id || !service_id || !unit_type || !created_by) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Missing required fields: customer_id, service_id, unit_type, created_by',
                },
                { status: 400 }
            );
        }

        // Get service details for pricing
        const service = await queryOne<any>(
            'SELECT * FROM services WHERE id = ?',
            [service_id]
        );

        if (!service) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Service not found',
                },
                { status: 404 }
            );
        }

        // Calculate estimated price
        let estimatedPrice = 0;
        if (unit_type === UnitType.KG && estimated_weight) {
            estimatedPrice = estimated_weight * service.base_price;
        } else if (unit_type === UnitType.PIECE && quantity) {
            estimatedPrice = quantity * service.base_price;
        }

        // Apply Express Markup (50%)
        if (priority === OrderPriority.EXPRESS) {
            estimatedPrice = estimatedPrice * 1.5;
        }

        // Apply minimum charge if applicable
        if (service.minimum_charge && estimatedPrice < service.minimum_charge) {
            estimatedPrice = service.minimum_charge;
        }

        // Generate order number
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        const lastOrder = await queryOne<{ order_number: string }>(
            `SELECT order_number FROM orders 
       WHERE order_number LIKE ? 
       ORDER BY id DESC LIMIT 1`,
            [`ORD-${dateStr}-%`]
        );

        let orderNumber = `ORD-${dateStr}-0001`;
        if (lastOrder && lastOrder.order_number) {
            const lastSeq = parseInt(lastOrder.order_number.split('-')[2]);
            orderNumber = `ORD-${dateStr}-${String(lastSeq + 1).padStart(4, '0')}`;
        }

        // Calculate estimated completion time
        // Use express_hours if priority is EXPRESS, otherwise use standard estimated_hours
        const estimatedHours = priority === OrderPriority.EXPRESS
            ? (service.express_hours || service.estimated_hours) // Fallback to standard if express_hours not set
            : service.estimated_hours;

        const estimatedCompletion = new Date();
        estimatedCompletion.setHours(estimatedCompletion.getHours() + estimatedHours);

        // Create order in transaction
        const result = await transaction(async (conn) => {
            // Insert order
            const [orderResult]: any = await conn.execute(
                `INSERT INTO orders 
         (order_number, customer_id, service_id, estimated_weight, quantity, unit_type,
          estimated_price, payment_status, paid_amount, payment_method, current_status,
          priority, estimated_completion, special_instructions, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderNumber,
                    customer_id,
                    service_id,
                    estimated_weight || null,
                    quantity || null,
                    unit_type,
                    estimatedPrice,
                    payment_status || PaymentStatus.UNPAID,
                    paid_amount || 0,
                    payment_method || null,
                    OrderStatus.RECEIVED,
                    priority || OrderPriority.REGULAR,
                    estimatedCompletion,
                    special_instructions || null,
                    created_by,
                ]
            );

            const orderId = orderResult.insertId;

            // Log initial status
            await conn.execute(
                `INSERT INTO order_status_log 
         (order_id, previous_status, new_status, changed_by, notes)
         VALUES (?, NULL, ?, ?, ?)`,
                [orderId, OrderStatus.RECEIVED, created_by, 'Order created']
            );

            // Record initial payment transaction if applicable
            if (paid_amount && parseFloat(paid_amount) > 0) {
                await conn.execute(
                    `INSERT INTO payment_transactions 
                    (order_id, transaction_type, amount, payment_method, notes, created_by)
                    VALUES (?, 'payment', ?, ?, 'Initial payment at order creation', ?)`,
                    [
                        orderId,
                        paid_amount,
                        payment_method || 'cash',
                        created_by
                    ]
                );
            }

            return orderId;
        });

        // Fetch the created order with details
        const newOrder = await queryOne<any>(
            `SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        s.service_name,
        s.service_type
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       JOIN services s ON o.service_id = s.id
       WHERE o.id = ?`,
            [result]
        );

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: newOrder,
            message: 'Order created successfully',
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to create order',
            },
            { status: 500 }
        );
    }
}
