import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);

        const contracts = await query(
            `SELECT * FROM customer_contracts 
       WHERE customer_id = ? 
       ORDER BY is_active DESC, end_date DESC`,
            [customerId]
        );

        return NextResponse.json({ success: true, data: contracts });

    } catch (error) {
        console.error('Error fetching contracts:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch contracts' },
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
            contract_type,
            start_date,
            end_date,
            sla_modifier_hours,
            price_modifier_percent,
            billing_cycle,
            terms_and_conditions
        } = body;

        if (!contract_type || !start_date || !end_date) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO customer_contracts 
       (customer_id, contract_type, start_date, end_date, sla_modifier_hours, price_modifier_percent, billing_cycle, terms_and_conditions, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
                customerId,
                contract_type,
                start_date,
                end_date,
                sla_modifier_hours || 0,
                price_modifier_percent || 0,
                billing_cycle || 'PerOrder',
                terms_and_conditions
            ]
        );

        // If this is a new active contract, we might want to deactivate others or handle overlaps
        // For now, allow multiple active contracts (e.g., specific services vs general)

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error('Error creating contract:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create contract' },
            { status: 500 }
        );
    }
}
