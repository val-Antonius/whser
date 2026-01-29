import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

async function run() {
    try {
        const sqlPath = path.join(process.cwd(), 'database/migrations/phase5_add_metrics_to_tasks.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await query(sql);
        console.log('✅ Migration applied successfully');
    } catch (e) {
        console.error('Migration failed:', e);
    }
    process.exit(0);
}

run();
