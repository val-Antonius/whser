// ============================================================================
// CUSTOMER DETAIL API
// ============================================================================
// Purpose: API endpoint for fetching single customer with complete details
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse } from '@/types';

/**
 * GET /api/customers/[id]
 * Get single customer with complete details including order history
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const customerId = parseInt(params.id);

        // Get customer details
        const [customer] = await query<any>(
            'SELECT * FROM customers WHERE id = ?',
            [customerId]
        );

        if (!customer) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Customer not found',
                },
                { status: 404 }
            );
        }

        // Parse JSON fields
        if (customer.preferences && typeof customer.preferences === 'string') {
            customer.preferences = JSON.parse(customer.preferences);
        }

        // Get order history
        const orderHistory = await query<any>(
            `SELECT 
        o.id,
        o.order_number,
        o.service_id,
        s.service_name,
        o.current_status,
        o.payment_status,
        o.estimated_price,
        o.paid_amount,
        o.created_at,
        o.estimated_completion,
        o.actual_completion
       FROM orders o
       JOIN services s ON o.service_id = s.id
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC
       LIMIT 50`,
            [customerId]
        );

        // Calculate statistics
        const totalOrders = orderHistory.length;
        const completedOrders = orderHistory.filter(o =>
            ['completed', 'ready_for_pickup', 'closed'].includes(o.current_status)
        ).length;
        const totalSpent = orderHistory
            .filter(o => o.payment_status === 'paid')
            .reduce((sum, o) => sum + parseFloat(o.paid_amount || 0), 0);
        const pendingPayment = orderHistory
            .filter(o => o.payment_status === 'unpaid')
            .reduce((sum, o) => sum + parseFloat(o.estimated_price || 0), 0);

        // Get last order date
        const lastOrderDate = orderHistory.length > 0
            ? orderHistory[0].created_at
            : null;

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: {
                customer,
                orderHistory,
                statistics: {
                    totalOrders,
                    completedOrders,
                    totalSpent,
                    pendingPayment,
                    lastOrderDate,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch customer details',
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/customers/[id]
 * Update customer information
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const customerId = parseInt(params.id);
        const body = await request.json();
        const { name, phone, email, address, segment, preferences, notes, is_active } = body;

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            values.push(address);
        }
        if (segment !== undefined) {
            updates.push('segment = ?');
            values.push(segment);
        }
        if (preferences !== undefined) {
            updates.push('preferences = ?');
            values.push(JSON.stringify(preferences));
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'No fields to update',
                },
                { status: 400 }
            );
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(customerId);

        await query(
            `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Fetch updated customer
        const [updatedCustomer] = await query<any>(
            'SELECT * FROM customers WHERE id = ?',
            [customerId]
        );

        // Parse JSON fields
        if (updatedCustomer.preferences && typeof updatedCustomer.preferences === 'string') {
            updatedCustomer.preferences = JSON.parse(updatedCustomer.preferences);
        }

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: updatedCustomer,
            message: 'Customer updated successfully',
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to update customer',
            },
            { status: 500 }
        );
    }
}
