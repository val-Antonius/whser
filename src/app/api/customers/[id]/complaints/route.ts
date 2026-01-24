import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);

        const complaints = await query(
            `SELECT c.*, o.order_number, u.name as created_by_name
       FROM customer_complaints c
       LEFT JOIN orders o ON c.order_id = o.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.customer_id = ?
       ORDER BY c.created_at DESC`,
            [customerId]
        );

        return NextResponse.json({ success: true, data: complaints });

    } catch (error) {
        console.error('Error fetching complaints:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch complaints' },
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

        const {
            order_id,
            category,
            severity,
            description,
            created_by
        } = body;

        if (!category || !description) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO customer_complaints 
       (customer_id, order_id, category, severity, description, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'Open', ?)`,
            [
                customerId,
                order_id || null,
                category,
                severity || 'Low',
                description,
                created_by // Assuming passed from frontend or session
            ]
        );

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error('Error creating complaint:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create complaint' },
            { status: 500 }
        );
    }
}
