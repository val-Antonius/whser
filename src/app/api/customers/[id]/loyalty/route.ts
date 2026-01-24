import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);

        // Fetch loyalty history
        const history = await query(
            `SELECT h.*, o.order_number 
       FROM customer_loyalty_history h
       LEFT JOIN orders o ON h.order_id = o.id
       WHERE h.customer_id = ?
       ORDER BY h.created_at DESC`,
            [customerId]
        );

        // Fetch current loyalty stats from customer table
        const customerStats = await query(
            `SELECT loyalty_tier, total_lifetime_value, risk_score
       FROM customers
       WHERE id = ?`,
            [customerId]
        );

        if (customerStats.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                current_tier: customerStats[0].loyalty_tier,
                lifetime_value: customerStats[0].total_lifetime_value,
                risk_score: customerStats[0].risk_score,
                history: history
            }
        });

    } catch (error) {
        console.error('Error fetching loyalty history:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch loyalty history' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);
        const body = await request.json();

        const { change_type, points_earned, description, new_tier } = body;

        if (!change_type || points_earned === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Insert loyalty history record
        await query(
            `INSERT INTO customer_loyalty_history 
       (customer_id, change_type, points_earned, description, new_tier)
       VALUES (?, ?, ?, ?, ?)`,
            [customerId, change_type, points_earned, description, new_tier]
        );

        // If tier change, update customer record
        if (new_tier) {
            await query(
                `UPDATE customers SET loyalty_tier = ? WHERE id = ?`,
                [new_tier, customerId]
            );
        }

        // Optionally update risk score if provided in a separate call or logic
        // For now we assume this endpoint is strictly for loyalty/points/tier

        return NextResponse.json({ success: true, message: 'Loyalty record updated' });

    } catch (error) {
        console.error('Error updating loyalty:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update loyalty' },
            { status: 500 }
        );
    }
}
