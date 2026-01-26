import { createPool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { BlueprintService } from '../src/lib/services/blueprint-service';

// Mock DB import for the service
// Since we are running outside Next.js, we need to ensure the service uses the pool created here 
// or the one in lib/db.ts is configured correctly via Env Vars. 
// My previous scripts established env vars, so lib/db.ts content (which uses process.env) should work if imported.

// Load env vars
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

async function testServiceDirectly() {
    console.log('🧪 Starting Direct Service Test');

    // 1. We need a valid service ID
    // We can use the one we seeded 'Regular Wash & Fold'
    // I'll assume we can query DB to find it.
    // Note: BlueprintService uses 'query' from '@/lib/db'. 
    // We need to make sure '@/lib/db' resolves correctly in tsx. 
    // 'tsx' handles tsconfig paths usually.

    try {
        // Create a dummy order to test with
        // We'll insert a fake order manually to avoid API
        const pool = createPool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'laundry_management',
        });

        const [services]: any = await pool.query('SELECT id FROM services WHERE service_name LIKE "%Wash%" LIMIT 1');
        if (!services.length) throw new Error('No service found');
        const serviceId = services[0].id;

        const [users]: any = await pool.query('SELECT id FROM users LIMIT 1');
        const userId = users[0]?.id || 1;

        const [customers]: any = await pool.query('SELECT id FROM customers LIMIT 1');
        const customerId = customers[0]?.id || 1;

        // Insert Fake Order
        const [res]: any = await pool.query(
            'INSERT INTO orders (order_number, customer_id, service_id, unit_type, estimated_price, created_by) VALUES (?, ?, ?, "kg", 10000, ?)',
            ['TEST-DECOMP-' + Date.now(), customerId, serviceId, userId]
        );
        const orderId = res.insertId;
        console.log(`📝 Created Test Order #${orderId}`);

        // RUN THE SERVICE
        await BlueprintService.decomposeOrder(orderId, serviceId);

        // VERIFY
        const [jobs]: any = await pool.query('SELECT * FROM order_jobs WHERE order_id = ?', [orderId]);
        console.log(`\n🔍 Verification Results:`);
        if (jobs.length > 0) {
            console.log(`✅ SUCCESS: Found ${jobs.length} generated jobs for Order #${orderId}`);
            jobs.forEach((job: any) => console.log(`   - ${job.job_name} (Order: ${job.job_order}, Status: ${job.status})`));
        } else {
            console.error('❌ FAILURE: No jobs created');
        }

        await pool.end();

    } catch (e) {
        console.error('❌ Test Error:', e);
    }
}

testServiceDirectly();
