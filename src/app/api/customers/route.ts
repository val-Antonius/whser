// ============================================================================
// CUSTOMERS API ROUTES
// ============================================================================
// Purpose: API endpoints for customer search, create, and management
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Customer, CustomerSegment, ApiResponse } from '@/types';

/**
 * GET /api/customers
 * Search customers by name or phone
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '10');

        let sql = 'SELECT * FROM customers WHERE is_active = 1';
        const params: any[] = [];

        if (search) {
            sql += ' AND (name LIKE ? OR phone LIKE ? OR customer_number LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const customers = await query<Customer>(sql, params);

        return NextResponse.json<ApiResponse<Customer[]>>({
            success: true,
            data: customers,
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to fetch customers',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phone, email, address, segment, preferences, notes, created_by } = body;

        // Validation
        if (!name || !created_by) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Name and created_by are required',
                },
                { status: 400 }
            );
        }

        // Generate customer number
        const lastCustomer = await queryOne<{ customer_number: string }>(
            'SELECT customer_number FROM customers ORDER BY id DESC LIMIT 1'
        );

        let customerNumber = 'CUST-0001';
        if (lastCustomer && lastCustomer.customer_number) {
            const lastNumber = parseInt(lastCustomer.customer_number.split('-')[1]);
            customerNumber = `CUST-${String(lastNumber + 1).padStart(4, '0')}`;
        }

        // Insert customer
        const result: any = await query(
            `INSERT INTO customers 
       (customer_number, name, phone, email, address, segment, preferences, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customerNumber,
                name,
                phone || null,
                email || null,
                address || null,
                segment || CustomerSegment.REGULAR,
                preferences ? JSON.stringify(preferences) : null,
                notes || null,
                created_by,
            ]
        );

        // Fetch the created customer
        const newCustomer = await queryOne<Customer>(
            'SELECT * FROM customers WHERE id = ?',
            [result.insertId]
        );

        return NextResponse.json<ApiResponse<Customer>>({
            success: true,
            data: newCustomer!,
            message: 'Customer created successfully',
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Failed to create customer',
            },
            { status: 500 }
        );
    }
}
