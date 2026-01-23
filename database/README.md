# Database Setup Guide

## Prerequisites

- MySQL Server installed (version 8.0 or higher recommended)
- MySQL Workbench or command-line access to MySQL
- Node.js and npm installed

## Step-by-Step Setup

### 1. Execute Database Schema

**Option A: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open the file: `database/schema.sql`
4. Click the lightning bolt icon (Execute) or press `Ctrl+Shift+Enter`
5. Wait for execution to complete
6. Verify no errors in the output panel

**Option B: Using Command Line**
```bash
# Navigate to project root
cd d:\toni\cloningRepo\whser

# Execute schema
mysql -u root -p < database/schema.sql

# Enter your MySQL password when prompted
```

**Verification:**
```sql
-- Check if database was created
SHOW DATABASES LIKE 'laundry_management';

-- Use the database
USE laundry_management;

-- Check if all tables were created
SHOW TABLES;
-- Should show 20 tables
```

### 2. Execute Seed Data

**Option A: Using MySQL Workbench**
1. In MySQL Workbench, open the file: `database/seed_data.sql`
2. Click the lightning bolt icon (Execute)
3. Wait for execution to complete
4. Verify no errors

**Option B: Using Command Line**
```bash
mysql -u root -p laundry_management < database/seed_data.sql
```

**Verification:**
```sql
USE laundry_management;

-- Verify data was inserted
SELECT COUNT(*) as user_count FROM users;           -- Should be 4
SELECT COUNT(*) as service_count FROM services;     -- Should be 5
SELECT COUNT(*) as process_count FROM service_processes; -- Should be 26
SELECT COUNT(*) as customer_count FROM customers;   -- Should be 8
SELECT COUNT(*) as order_count FROM orders;         -- Should be 4
SELECT COUNT(*) as inventory_count FROM inventory_items; -- Should be 14

-- View sample data
SELECT * FROM orders;
SELECT * FROM customers;
SELECT * FROM services;
```

### 3. Configure Environment Variables

1. Copy the example environment file:
```bash
# Windows PowerShell
Copy-Item .env.local.example .env.local

# Or manually create .env.local
```

2. Edit `.env.local` and update the database password:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password_here
DB_NAME=laundry_management
```

3. Save the file

### 4. Test Database Connection

Create a test script to verify the connection:

**Create:** `src/lib/test-db.ts`
```typescript
import { testConnection } from './db';

async function main() {
  console.log('Testing database connection...');
  const success = await testConnection();
  
  if (success) {
    console.log('✅ Database connection successful!');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed!');
    process.exit(1);
  }
}

main();
```

**Run the test:**
```bash
npx tsx src/lib/test-db.ts
```

**Expected Output:**
```
Testing database connection...
✅ Database connection successful
✅ Database connection successful!
```

### 5. Verify Triggers

Test the automated triggers:

```sql
-- Test inventory update trigger
SELECT current_stock FROM inventory_items WHERE id = 1;
-- Note the current stock value

INSERT INTO inventory_transactions 
(inventory_item_id, transaction_type, quantity, stock_before, stock_after, created_by)
VALUES (1, 'stock_in', 10.00, 49.50, 59.50, 1);

SELECT current_stock FROM inventory_items WHERE id = 1;
-- Should be updated to 59.50

-- Test order status log trigger
SELECT COUNT(*) FROM order_status_log WHERE order_id = 2;
-- Note the count

UPDATE orders SET current_status = 'in_dry', created_by = 1 WHERE id = 2;

SELECT COUNT(*) FROM order_status_log WHERE order_id = 2;
-- Count should increase by 1

SELECT * FROM order_status_log WHERE order_id = 2 ORDER BY changed_at DESC LIMIT 1;
-- Should show the new status change
```

## Database Schema Overview

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts | id, name, email, role |
| `customers` | Customer master data | id, customer_number, name, segment |
| `services` | Service definitions | id, service_code, service_type, base_price |
| `service_processes` | Process blueprints | id, service_id, process_name, process_order |
| `orders` | **Single source of truth** | id, order_number, current_status, payment_status |
| `order_jobs` | Process execution | id, order_id, job_name, status |
| `order_status_log` | Audit trail | id, order_id, previous_status, new_status |
| `inventory_items` | Inventory master | id, item_code, current_stock, minimum_stock |
| `inventory_transactions` | Stock movements | id, transaction_type, quantity, stock_before, stock_after |
| `inventory_consumption` | Usage per order | id, order_id, inventory_item_id, actual_quantity |

### Analytics Tables (Phase 3+)

| Table | Purpose | Phase |
|-------|---------|-------|
| `data_snapshots` | Period data freezing | Phase 3 |
| `analytical_metrics` | Calculated metrics | Phase 3 |
| `insights` | Generated insights | Phase 3-4 |
| `recommendations` | System recommendations | Phase 4 |
| `tasks` | Managerial tasks | Phase 5 |

## Troubleshooting

### Connection Refused
**Problem:** Cannot connect to MySQL server

**Solution:**
1. Verify MySQL service is running
2. Check MySQL port (default: 3306)
3. Verify credentials in `.env.local`

### Access Denied
**Problem:** Access denied for user 'root'@'localhost'

**Solution:**
1. Verify password in `.env.local` is correct
2. Grant privileges if needed:
```sql
GRANT ALL PRIVILEGES ON laundry_management.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Table Already Exists
**Problem:** Error when running schema.sql - table already exists

**Solution:**
Drop the database and recreate:
```sql
DROP DATABASE IF EXISTS laundry_management;
```
Then re-run `schema.sql`

### Foreign Key Constraint Fails
**Problem:** Cannot insert seed data due to foreign key constraints

**Solution:**
1. Ensure schema.sql was executed successfully first
2. Check that all parent tables have data before child tables
3. Verify foreign key references are correct

## Next Steps

After successful database setup:
1. ✅ Database schema created
2. ✅ Seed data inserted
3. ✅ Environment configured
4. ✅ Connection tested
5. ➡️ Proceed to Phase 1.2: User Role System

## Useful Queries

### View All Orders with Customer Names
```sql
SELECT 
  o.order_number,
  c.name as customer_name,
  s.service_name,
  o.current_status,
  o.payment_status,
  o.estimated_price,
  o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN services s ON o.service_id = s.id
ORDER BY o.created_at DESC;
```

### View Order Status History
```sql
SELECT 
  o.order_number,
  osl.previous_status,
  osl.new_status,
  osl.changed_at,
  u.name as changed_by_user
FROM order_status_log osl
JOIN orders o ON osl.order_id = o.id
LEFT JOIN users u ON osl.changed_by = u.id
WHERE o.order_number = 'ORD-20260123-0001'
ORDER BY osl.changed_at;
```

### View Inventory Stock Levels
```sql
SELECT 
  item_code,
  item_name,
  current_stock,
  minimum_stock,
  unit_of_measure,
  CASE 
    WHEN current_stock <= minimum_stock THEN 'REORDER'
    ELSE 'OK'
  END as stock_status
FROM inventory_items
WHERE is_active = TRUE
ORDER BY category, item_name;
```

### View Service Process Blueprints
```sql
SELECT 
  s.service_name,
  sp.process_order,
  sp.process_name,
  sp.estimated_duration_minutes,
  sp.is_required
FROM service_processes sp
JOIN services s ON sp.service_id = s.id
WHERE s.service_code = 'REG-WASH'
ORDER BY sp.process_order;
```
