import { createPool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Load env vars manually since we are running standalone
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
            console.log('✅ Loaded .env.local');
        } else {
            console.warn('⚠️  .env.local not found, relying on system env vars');
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

async function seed() {
    const pool = createPool(dbConfig);
    console.log('Connecting to database...');

    try {
        // 1. Get Service IDs
        const [services]: any = await pool.query('SELECT id, service_name FROM services');
        const washFold = services.find((s: any) => s.service_name.includes('Wash & Fold') || s.service_name.includes('Cuci Lipat') || s.service_name.includes('Regular'));
        const dryClean = services.find((s: any) => s.service_name.includes('Dry Clean') || s.service_name.includes('Satuan'));
        const ironOnly = services.find((s: any) => s.service_name.includes('Iron') || s.service_name.includes('Setrika'));

        if (!washFold) {
            console.error('❌ Could not find Wash & Fold service to seed. Please ensure services exist.');
            return;
        }

        console.log(`Found Service: ${washFold.service_name} (ID: ${washFold.id})`);

        // 2. Clear existing processes for clean slate (optional, be careful in prod)
        // await pool.query('DELETE FROM service_processes WHERE service_id = ?', [washFold.id]);

        // 3. Insert Wash & Fold Workflow
        const wfProcesses = [
            { name: 'Washing', order: 1, duration: 45, desc: 'Wash cycle in machine' },
            { name: 'Drying', order: 2, duration: 60, desc: 'Tumble dry' },
            { name: 'Folding', order: 3, duration: 15, desc: 'Fold and pack' },
        ];

        for (const p of wfProcesses) {
            await pool.query(
                `INSERT INTO service_processes 
                (service_id, process_name, process_order, estimated_duration_minutes, description) 
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                process_name = VALUES(process_name),
                estimated_duration_minutes = VALUES(estimated_duration_minutes)`,
                [washFold.id, p.name, p.order, p.duration, p.desc]
            );
            console.log(`   - Added/Updated Step: ${p.name}`);
        }

        // 4. Insert Dry Clean Workflow (if exists)
        if (dryClean) {
            console.log(`Found Service: ${dryClean.service_name} (ID: ${dryClean.id})`);
            const dcProcesses = [
                { name: 'Spotting', order: 1, duration: 20, desc: 'Stain treatment' },
                { name: 'Dry Cleaning', order: 2, duration: 90, desc: 'Dry clean cycle' },
                { name: 'Steam Press / Iron', order: 3, duration: 30, desc: 'Professional pressing' },
                { name: 'QC & Packaging', order: 4, duration: 10, desc: 'Final check' },
            ];

            for (const p of dcProcesses) {
                await pool.query(
                    `INSERT INTO service_processes 
                    (service_id, process_name, process_order, estimated_duration_minutes, description) 
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    process_name = VALUES(process_name),
                    estimated_duration_minutes = VALUES(estimated_duration_minutes)`,
                    [dryClean.id, p.name, p.order, p.duration, p.desc]
                );
                console.log(`   - Added/Updated Step: ${p.name}`);
            }
        }

        console.log('✅ Seeding complete!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await pool.end();
    }
}

seed();
