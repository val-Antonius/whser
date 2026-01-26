import { createPool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    process.env[match[1].trim()] = match[2].trim();
                }
            });
        }
    } catch (e) {
        console.error('Error loading env:', e);
    }
}
loadEnv();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laundry_management',
};

async function fixSchema() {
    const pool = createPool(dbConfig);
    console.log('🔧 Fixing `order_jobs` schema...');

    try {
        // Add started_at
        try {
            await pool.query('ALTER TABLE order_jobs ADD COLUMN started_at DATETIME NULL');
            console.log('✅ Added column `started_at`');
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ Column `started_at` already exists');
            else throw e;
        }

        // Add completed_at
        try {
            await pool.query('ALTER TABLE order_jobs ADD COLUMN completed_at DATETIME NULL');
            console.log('✅ Added column `completed_at`');
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('ℹ️ Column `completed_at` already exists');
            else throw e;
        }

        console.log('🎉 Schema fix complete!');

    } catch (error) {
        console.error('❌ Schema Fix Failed:', error);
    } finally {
        await pool.end();
    }
}

fixSchema();
