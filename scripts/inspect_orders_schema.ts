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

async function checkSchema() {
    const pool = createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'laundry_management',
    });

    try {
        const [rows]: any = await pool.query(`SHOW COLUMNS FROM orders`);
        console.log('Columns in `orders`:');
        rows.forEach((r: any) => console.log(`- ${r.Field} (${r.Type})`));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

checkSchema();
