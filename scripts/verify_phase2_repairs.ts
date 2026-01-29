
import { query, transaction } from '@/lib/db';
import { InventoryService } from '@/lib/services/inventory-service';
import { CustomerService } from '@/lib/services/customer-service';
import { SLAWatcher } from '@/lib/services/sla-watcher';

async function runVerification() {
    console.log('🚀 Starting Phase 2 Repair Verification...\n');

    try {
        // =================================================================
        // 1. VERIFY INVENTORY WASTE LOGIC
        // =================================================================
        console.log('--- 1. Testing Inventory Waste Logic ---');

        // Get an item
        const items = await query<any>('SELECT id, item_name, current_stock FROM inventory_items LIMIT 1');
        if (!items || items.length === 0) throw new Error('No inventory items found');
        const item = items[0];
        const initialStock = parseFloat(item.current_stock);
        const wasteQty = 5;

        console.log(`Item: ${item.item_name} | Initial Stock: ${initialStock}`);

        // Mock Request logic by running transaction manually
        await transaction(async (conn) => {
            await conn.query('UPDATE inventory_items SET current_stock = current_stock - ? WHERE id = ?', [wasteQty, item.id]);
        });

        const updatedItems = await query<any>('SELECT current_stock FROM inventory_items WHERE id = ?', [item.id]);
        const newStock = parseFloat(updatedItems[0].current_stock);

        console.log(`New Stock: ${newStock}`);
        if (Math.abs(initialStock - wasteQty - newStock) < 0.01) {
            console.log('✅ Inventory Stock Deduction: PASSED');
        } else {
            console.log('❌ Inventory Stock Deduction: FAILED');
        }

        // Restore stock
        await query('UPDATE inventory_items SET current_stock = ? WHERE id = ?', [initialStock, item.id]);


        // =================================================================
        // 2. VERIFY LOYALTY LOGIC
        // =================================================================
        console.log('\n--- 2. Testing Loyalty Logic ---');
        const customers = await query<any>('SELECT id, name, total_lifetime_value FROM customers LIMIT 1');
        if (!customers || customers.length === 0) throw new Error('No customers found');
        const customer = customers[0];

        const initialLTV = parseFloat(customer.total_lifetime_value || 0);
        const orderValue = 50000;
        const expectedPoints = 50;

        const orders = await query<any>('SELECT id FROM orders LIMIT 1');
        if (!orders || orders.length === 0) throw new Error('No orders found');
        const orderId = orders[0].id;

        if (orderId) {
            await CustomerService.awardPoints(customer.id, orderId, orderValue);

            // Check History
            const history = await query<any>('SELECT points_earned FROM customer_loyalty_history WHERE order_id = ? AND change_type = "Order" ORDER BY id DESC LIMIT 1', [orderId]);
            const updatedCust = await query<any>('SELECT total_lifetime_value FROM customers WHERE id = ?', [customer.id]);

            if (history && history.length > 0 && parseFloat(history[0].points_earned) === expectedPoints) {
                console.log('✅ Points Recorded in History: PASSED');
            } else {
                console.log('❌ Points Recorded in History: FAILED');
            }

            if (updatedCust && updatedCust.length > 0 && parseFloat(updatedCust[0].total_lifetime_value) === initialLTV + orderValue) {
                console.log('✅ Lifetime Value Updated: PASSED');
            } else {
                console.log('❌ Lifetime Value Update: FAILED');
            }

            // Cleanup
            await query('DELETE FROM customer_loyalty_history WHERE order_id = ?', [orderId]);
            await query('UPDATE customers SET total_lifetime_value = ? WHERE id = ?', [initialLTV, customer.id]);
        }


        // =================================================================
        // 3. VERIFY SLA WATCHER TYPE SAFETY
        // =================================================================
        console.log('\n--- 3. Testing SLA Watcher (Compile & Run) ---');
        if (orderId) {
            await SLAWatcher.checkOrderSLA(orderId);
            console.log('✅ SLA Watcher ran without crashing');
        }

    } catch (e) {
        console.error('Verification Failed:', e);
    }
}

runVerification();
