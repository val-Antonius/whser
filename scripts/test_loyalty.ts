import { createPool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { CustomerService } from '../src/lib/services/customer-service';

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

async function testLoyalty() {
    console.log('🧪 Starting Loyalty Logic Test');
    const pool = createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'laundry_management',
    });

    try {
        // 1. Create a dummy test customer
        const [res]: any = await pool.query(
            'INSERT INTO customers (customer_number, name, phone, segment) VALUES (?, ?, ?, "regular")',
            [`CUST-${Date.now()}`, 'LoyaltyTester', '08999999999']
        );
        const customerId = res.insertId;
        console.log(`👤 Created Test Customer #${customerId} (Segment: regular)`);

        // 2. Insert Orders worth 1.500.000 (enough for VIP)
        // We insert them as 'completed' directly to test the calculation logic
        await pool.query(
            `INSERT INTO orders 
            (order_number, customer_id, service_id, unit_type, estimated_price, paid_amount, current_status, created_by) 
            VALUES 
            (?, ?, 1, 'kg', 500000, 500000, 'completed', 1),
            (?, ?, 1, 'kg', 600000, 600000, 'completed', 1)`,
            [`LOY-1-${Date.now()}`, customerId, `LOY-2-${Date.now()}`, customerId]
        );
        console.log('💰 Inserted 2 Completed Orders (Total: 1.1M)');

        // 3. Trigger Logic
        console.log('🔄 Triggering Check...');
        await CustomerService.checkAndUpgradeSegment(customerId);

        // 4. Verify
        const [cust]: any = await pool.query('SELECT segment FROM customers WHERE id = ?', [customerId]);
        const newSegment = cust[0].segment;

        if (newSegment === 'vip') {
            console.log('✅ SUCCESS: Customer upgraded to VIP!');
        } else {
            console.error(`❌ FAILED: Customer is still ${newSegment}`);
        }

    } catch (e) {
        console.error('❌ Test Failed:', e);
    } finally {
        await pool.end();
    }
}

testLoyalty();
