import { createPool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

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

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laundry_management',
};

async function testOrderFlow() {
    const pool = createPool(dbConfig);
    console.log('🧪 Starting System Test: Order Decomposition');

    try {
        // 1. Get a Service ID (Wash & Fold)
        const [services]: any = await pool.query('SELECT id, service_name FROM services WHERE service_name LIKE "%Wash%" LIMIT 1');
        if (!services.length) throw new Error('No Wash & Fold service found');
        const serviceId = services[0].id;
        console.log(`Using Service: ${services[0].service_name} (ID: ${serviceId})`);

        // 2. Get a Customer
        const [customers]: any = await pool.query('SELECT id FROM customers LIMIT 1');
        if (!customers.length) throw new Error('No customers found');
        const customerId = customers[0].id;

        // 3. Create Order via API
        console.log('📡 Sending POST /api/orders request...');
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: customerId,
                service_id: serviceId,
                estimated_weight: 5.0,
                unit_type: 'kg',
                priority: 'regular',
                payment_status: 'unpaid',
                created_by: 1
            })
        });

        const result = await response.json();

        if (!result.success) {
            console.error('❌ API Error:', result.error);
            return;
        }

        const orderId = result.data.id;
        console.log(`✅ Order Created: #${orderId} (${result.data.order_number})`);

        // 4. Verify Job Creation in DB
        const [jobs]: any = await pool.query(
            'SELECT * FROM order_jobs WHERE order_id = ? ORDER BY job_order ASC',
            [orderId]
        );

        console.log(`\n🔍 Verification Results:`);
        if (jobs.length > 0) {
            console.log(`✅ SUCCESS: Found ${jobs.length} Generated Jobs`);
            jobs.forEach((job: any) => {
                console.log(`   - [${job.status.toUpperCase()}] Job ${job.job_order}: ${job.job_name} (${job.estimated_duration_minutes} min)`);
            });
        } else {
            console.error('❌ FAILURE: No jobs were created in order_jobs table!');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await pool.end();
    }
}

testOrderFlow();
