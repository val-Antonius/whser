import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');

        let query = 'SELECT id, name, email, role, is_active FROM users';
        const params: any[] = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }

        query += ' ORDER BY name ASC';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
