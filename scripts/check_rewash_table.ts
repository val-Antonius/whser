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

async function checkTable() {
    const pool = createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'laundry_management',
    });

    try {
        const [rows]: any = await pool.query(`SHOW TABLES LIKE 'rewash_events'`);
        if (rows.length > 0) {
            console.log('✅ Table `rewash_events` exists.');
        } else {
            console.log('❌ Table `rewash_events` DOES NOT exist.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

checkTable();
