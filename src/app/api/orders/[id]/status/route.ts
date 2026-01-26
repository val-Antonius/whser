// ============================================================================
// ORDER STATUS UPDATE API
// ============================================================================
// Purpose: API endpoint for updating order status with validation
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { OrderStatus, ApiResponse } from '@/types';
import { InventoryService } from '@/lib/services/inventory-service';
import { BlueprintService } from '@/lib/services/blueprint-service';
import { CustomerService } from '@/lib/services/customer-service';

/**
 * PATCH /api/orders/[id]/status
 * Update order status with validation and logging
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params (Next.js 15 requirement)
        const { id } = await params;
        const orderId = parseInt(id);
        const body = await request.json();
        const { new_status, notes, changed_by } = body;

        // Validation
        if (!new_status || !changed_by) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'new_status and changed_by are required',
                },
                { status: 400 }
            );
        }

        // Get current order
        const [currentOrder] = await query<any>(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        if (!currentOrder) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Order not found',
                },
                { status: 404 }
            );
        }

        const previousStatus = currentOrder.current_status;

        // Validate status transition
        const validTransitions = getValidTransitions(previousStatus);
        if (!validTransitions.includes(new_status)) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: `Invalid status transition from ${previousStatus} to ${new_status}`,
                },
                { status: 400 }
            );
        }

        // Update order status in transaction
        await transaction(async (conn) => {
            // Update order
            await conn.execute(
                'UPDATE orders SET current_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [new_status, orderId]
            );

            // Log status change
            await conn.execute(
                `INSERT INTO order_status_log 
         (order_id, previous_status, new_status, changed_by, notes)
         VALUES (?, ?, ?, ?, ?)`,
                [orderId, previousStatus, new_status, changed_by, notes || null]
            );

            // [NEW] Sync Job Status (e.g. mark 'Washing' as in_progress)
            await BlueprintService.syncJobStatus(orderId, new_status, conn);

            // Update actual completion time if completing
            if (new_status === OrderStatus.COMPLETED) {
                if (!currentOrder.actual_completion) {
                    await conn.execute(
                        'UPDATE orders SET actual_completion = CURRENT_TIMESTAMP WHERE id = ?',
                        [orderId]
                    );
                }

                // [NEW] Check for Loyalty Upgrade
                await CustomerService.checkAndUpgradeSegment(currentOrder.customer_id, conn);
            }
        });

        // Fetch updated order
        const [updatedOrder] = await query<any>(
            `SELECT 
        o.*,
        c.name as customer_name,
        s.service_name
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       JOIN services s ON o.service_id = s.id
       WHERE o.id = ?`,
            [orderId]
        );

        // TRIGGER: Auto-Consumption if status changed to IN_WASH
        if (new_status === OrderStatus.IN_WASH) {
            // Run asynchronously to not block response
            InventoryService.processAutomaticConsumption(orderId, changed_by).catch(err => {
                console.error('Background auto-consumption failed:', err);
            });
        }

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: updatedOrder,
            message: `Order status updated from ${previousStatus} to ${new_status}`,
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to update order status',
            },
            { status: 500 }
        );
    }
}

/**
 * Get valid status transitions for current status
 * Implements status transition validation rules
 */
function getValidTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
        [OrderStatus.RECEIVED]: [
            OrderStatus.WAITING_FOR_PROCESS,
            OrderStatus.CANCELLED,
            OrderStatus.IN_WASH, // Allow skipping waiting
        ],
        [OrderStatus.WAITING_FOR_PROCESS]: [
            OrderStatus.IN_WASH,
            OrderStatus.CANCELLED,
        ],
        [OrderStatus.IN_WASH]: [
            OrderStatus.IN_DRY,
            OrderStatus.CANCELLED,
            OrderStatus.READY_FOR_QC, // Should allow skip to QA for flexibility
            OrderStatus.IN_IRON, // Skip Dry
        ],
        [OrderStatus.IN_DRY]: [
            OrderStatus.IN_IRON,
            OrderStatus.IN_FOLD,
            OrderStatus.READY_FOR_QC,
        ],
        [OrderStatus.IN_IRON]: [
            OrderStatus.IN_FOLD,
            OrderStatus.READY_FOR_QC,
        ],
        [OrderStatus.IN_FOLD]: [
            OrderStatus.READY_FOR_QC,
        ],
        [OrderStatus.READY_FOR_QC]: [
            OrderStatus.COMPLETED,
            OrderStatus.IN_WASH, // For rewash
        ],
        [OrderStatus.COMPLETED]: [
            OrderStatus.READY_FOR_PICKUP,
        ],
        [OrderStatus.READY_FOR_PICKUP]: [
            OrderStatus.CLOSED,
        ],
        [OrderStatus.CLOSED]: [], // Terminal state
        [OrderStatus.CANCELLED]: [], // Terminal state
    };

    return transitions[currentStatus] || [];
}
