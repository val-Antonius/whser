-- ============================================================================
-- LAUNDRY MANAGEMENT PLATFORM - SEED DATA
-- ============================================================================
-- Purpose: Initial test data for development and testing
-- Version: 1.0
-- Created: 2026-01-23
-- ============================================================================

USE laundry_management;

-- ============================================================================
-- USERS
-- ============================================================================

INSERT INTO users (name, email, role, is_active) VALUES
('Admin User', 'admin@laundry.local', 'admin', TRUE),
('Owner User', 'owner@laundry.local', 'owner', TRUE),
('Operator 1', 'operator1@laundry.local', 'admin', TRUE),
('Operator 2', 'operator2@laundry.local', 'admin', TRUE);

-- ============================================================================
-- SERVICES
-- ============================================================================

INSERT INTO services (service_code, service_name, description, service_type, unit_type, base_price, minimum_charge, estimated_hours, express_hours, is_active) VALUES
('REG-WASH', 'Regular Wash & Fold', 'Standard laundry service with wash, dry, and fold', 'regular', 'kg', 8000.00, 25000.00, 48, 24, TRUE),
('EXP-WASH', 'Express Wash & Fold', 'Fast laundry service completed in 24 hours', 'express', 'kg', 12000.00, 35000.00, 24, 12, TRUE),
('DRY-CLEAN', 'Dry Cleaning', 'Professional dry cleaning service', 'dry_clean', 'piece', 25000.00, 25000.00, 72, 48, TRUE),
('IRON-ONLY', 'Iron Only', 'Ironing service for clean clothes', 'iron_only', 'kg', 5000.00, 15000.00, 24, 12, TRUE),
('WASH-ONLY', 'Wash Only', 'Washing service without drying or folding', 'wash_only', 'kg', 6000.00, 20000.00, 24, 12, TRUE);

-- ============================================================================
-- SERVICE PROCESSES (Blueprints)
-- ============================================================================

-- Regular Wash & Fold Process
INSERT INTO service_processes (service_id, process_name, process_order, estimated_duration_minutes, depends_on_process_id, is_required, description) VALUES
(1, 'Sorting & Inspection', 1, 15, NULL, TRUE, 'Sort laundry by color and fabric type, inspect for stains'),
(1, 'Washing', 2, 45, 1, TRUE, 'Machine wash with appropriate detergent'),
(1, 'Drying', 3, 60, 2, TRUE, 'Tumble dry or air dry based on fabric'),
(1, 'Folding', 4, 30, 3, TRUE, 'Fold and organize clean laundry'),
(1, 'Quality Check', 5, 10, 4, TRUE, 'Final inspection before packaging'),
(1, 'Packaging', 6, 10, 5, TRUE, 'Pack in plastic and label');

-- Express Wash & Fold Process (faster timing)
INSERT INTO service_processes (service_id, process_name, process_order, estimated_duration_minutes, depends_on_process_id, is_required, description) VALUES
(2, 'Sorting & Inspection', 1, 10, NULL, TRUE, 'Quick sort and stain check'),
(2, 'Washing', 2, 30, 7, TRUE, 'Express wash cycle'),
(2, 'Drying', 3, 45, 8, TRUE, 'High-speed drying'),
(2, 'Folding', 4, 20, 9, TRUE, 'Quick fold'),
(2, 'Quality Check', 5, 5, 10, TRUE, 'Fast QC'),
(2, 'Packaging', 6, 5, 11, TRUE, 'Pack and label');

-- Dry Cleaning Process
INSERT INTO service_processes (service_id, process_name, process_order, estimated_duration_minutes, depends_on_process_id, is_required, description) VALUES
(3, 'Inspection & Tagging', 1, 20, NULL, TRUE, 'Inspect items and attach tags'),
(3, 'Stain Pre-treatment', 2, 30, 13, TRUE, 'Treat stains before cleaning'),
(3, 'Dry Cleaning', 3, 90, 14, TRUE, 'Professional dry cleaning process'),
(3, 'Pressing', 4, 45, 15, TRUE, 'Steam press and finish'),
(3, 'Quality Check', 5, 15, 16, TRUE, 'Final inspection'),
(3, 'Packaging', 6, 10, 17, TRUE, 'Hang and cover with plastic');

-- Iron Only Process
INSERT INTO service_processes (service_id, process_name, process_order, estimated_duration_minutes, depends_on_process_id, is_required, description) VALUES
(4, 'Inspection', 1, 5, NULL, TRUE, 'Check items for damage'),
(4, 'Ironing', 2, 60, 19, TRUE, 'Iron all items'),
(4, 'Quality Check', 3, 5, 20, TRUE, 'Verify ironing quality'),
(4, 'Packaging', 4, 5, 21, TRUE, 'Fold and pack');

-- Wash Only Process
INSERT INTO service_processes (service_id, process_name, process_order, estimated_duration_minutes, depends_on_process_id, is_required, description) VALUES
(5, 'Sorting', 1, 10, NULL, TRUE, 'Sort by color and fabric'),
(5, 'Washing', 2, 45, 23, TRUE, 'Machine wash'),
(5, 'Quality Check', 3, 5, 24, TRUE, 'Check wash quality'),
(5, 'Packaging', 4, 5, 25, TRUE, 'Pack wet laundry');

-- ============================================================================
-- INVENTORY ITEMS
-- ============================================================================

INSERT INTO inventory_items (item_code, item_name, description, category, unit_of_measure, current_stock, minimum_stock, reorder_quantity, unit_cost, is_active) VALUES
-- Detergents
('DET-001', 'Liquid Detergent - Regular', 'Standard liquid detergent for regular wash', 'detergent', 'liter', 50.00, 20.00, 30.00, 15000.00, TRUE),
('DET-002', 'Liquid Detergent - Premium', 'Premium detergent for delicate fabrics', 'detergent', 'liter', 30.00, 15.00, 20.00, 25000.00, TRUE),
('DET-003', 'Powder Detergent', 'Powder detergent for heavy-duty wash', 'detergent', 'kg', 40.00, 15.00, 25.00, 12000.00, TRUE),

-- Softeners
('SOFT-001', 'Fabric Softener - Floral', 'Floral scented fabric softener', 'softener', 'liter', 35.00, 15.00, 25.00, 18000.00, TRUE),
('SOFT-002', 'Fabric Softener - Fresh', 'Fresh scent fabric softener', 'softener', 'liter', 35.00, 15.00, 25.00, 18000.00, TRUE),

-- Bleach
('BLE-001', 'Chlorine Bleach', 'Chlorine bleach for whites', 'bleach', 'liter', 25.00, 10.00, 15.00, 10000.00, TRUE),
('BLE-002', 'Oxygen Bleach', 'Color-safe oxygen bleach', 'bleach', 'liter', 20.00, 10.00, 15.00, 12000.00, TRUE),

-- Packaging
('PKG-001', 'Plastic Bags - Large', 'Large plastic bags for packaging', 'plastic', 'piece', 500, 100, 200, 500.00, TRUE),
('PKG-002', 'Plastic Bags - Medium', 'Medium plastic bags', 'plastic', 'piece', 500, 100, 200, 350.00, TRUE),
('PKG-003', 'Plastic Bags - Small', 'Small plastic bags', 'plastic', 'piece', 300, 100, 200, 250.00, TRUE),

-- Hangers
('HNG-001', 'Plastic Hangers', 'Standard plastic hangers', 'hanger', 'piece', 200, 50, 100, 1000.00, TRUE),
('HNG-002', 'Wooden Hangers', 'Premium wooden hangers', 'hanger', 'piece', 100, 30, 50, 3000.00, TRUE),

-- Other
('OTH-001', 'Stain Remover', 'Professional stain remover', 'other', 'bottle', 15, 5, 10, 35000.00, TRUE),
('OTH-002', 'Garment Covers', 'Plastic covers for dry cleaning', 'packaging', 'piece', 200, 50, 100, 1500.00, TRUE);

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

INSERT INTO customers (customer_number, name, phone, email, address, segment, preferences, notes, created_by) VALUES
('CUST-0001', 'John Doe', '081234567890', 'john.doe@email.com', 'Jl. Sudirman No. 123, Jakarta', 'regular', '{"preferred_detergent": "regular", "allergies": "none"}', 'Regular customer, prefers morning pickup', 1),
('CUST-0002', 'Jane Smith', '081234567891', 'jane.smith@email.com', 'Jl. Thamrin No. 45, Jakarta', 'vip', '{"preferred_detergent": "premium", "allergies": "fragrance"}', 'VIP customer, fragrance-free detergent only', 1),
('CUST-0003', 'PT. Tech Solutions', '081234567892', 'admin@techsolutions.com', 'Jl. Gatot Subroto No. 78, Jakarta', 'corporate', '{"billing_cycle": "monthly", "preferred_service": "express"}', 'Corporate client, monthly billing', 1),
('CUST-0004', 'Dormitory Universitas ABC', '081234567893', 'dorm@univ-abc.ac.id', 'Jl. Pendidikan No. 10, Jakarta', 'dormitory', '{"bulk_discount": true, "pickup_schedule": "weekly"}', 'Weekly bulk orders', 1),
('CUST-0005', 'Hotel Grand Jakarta', '081234567894', 'laundry@grandhotel.com', 'Jl. Hotel No. 1, Jakarta', 'hotel', '{"sla_strict": true, "quality_priority": "high"}', 'Hotel client, strict SLA requirements', 1),
('CUST-0006', 'Sarah Johnson', '081234567895', 'sarah.j@email.com', 'Jl. Merdeka No. 67, Jakarta', 'regular', '{"preferred_detergent": "regular"}', NULL, 1),
('CUST-0007', 'Michael Chen', '081234567896', 'michael.chen@email.com', 'Jl. Asia Afrika No. 89, Jakarta', 'regular', '{"preferred_service": "wash_only"}', 'Prefers wash-only service', 1),
('CUST-0008', 'Lisa Anderson', '081234567897', 'lisa.a@email.com', 'Jl. Kebon Sirih No. 34, Jakarta', 'vip', '{"preferred_detergent": "premium", "express_only": true}', 'VIP customer, always uses express service', 1);

-- ============================================================================
-- SAMPLE ORDERS (for testing)
-- ============================================================================

-- Order 1: Regular wash completed
INSERT INTO orders (order_number, customer_id, service_id, estimated_weight, actual_weight, unit_type, estimated_price, final_price, payment_status, paid_amount, payment_method, current_status, priority, estimated_completion, actual_completion, created_by, created_at) VALUES
('ORD-20260123-0001', 1, 1, 5.00, 5.20, 'kg', 40000.00, 41600.00, 'paid', 41600.00, 'cash', 'closed', 'regular', '2026-01-25 10:00:00', '2026-01-25 09:30:00', 1, '2026-01-23 10:00:00');

-- Order 2: Express wash in progress
INSERT INTO orders (order_number, customer_id, service_id, estimated_weight, actual_weight, unit_type, estimated_price, final_price, payment_status, paid_amount, payment_method, current_status, priority, estimated_completion, created_by, created_at) VALUES
('ORD-20260123-0002', 2, 2, 3.00, NULL, 'kg', 36000.00, NULL, 'partial', 20000.00, 'transfer', 'in_wash', 'express', '2026-01-24 10:00:00', 1, '2026-01-23 11:30:00');

-- Order 3: Dry cleaning waiting for process
INSERT INTO orders (order_number, customer_id, service_id, estimated_weight, quantity, unit_type, estimated_price, final_price, payment_status, current_status, priority, estimated_completion, special_instructions, created_by, created_at) VALUES
('ORD-20260123-0003', 8, 3, NULL, 2, 'piece', 50000.00, NULL, 'unpaid', 'waiting_for_process', 'regular', '2026-01-26 10:00:00', 'Handle with care - delicate fabric', 1, '2026-01-23 14:00:00');

-- Order 4: Iron only - received
INSERT INTO orders (order_number, customer_id, service_id, estimated_weight, unit_type, estimated_price, payment_status, current_status, priority, estimated_completion, created_by, created_at) VALUES
('ORD-20260123-0004', 6, 4, 4.00, 'kg', 20000.00, 'unpaid', 'received', 'regular', '2026-01-24 14:00:00', 1, '2026-01-23 15:30:00');

-- ============================================================================
-- ORDER STATUS LOG (for completed order)
-- ============================================================================

INSERT INTO order_status_log (order_id, previous_status, new_status, changed_by, changed_at, notes) VALUES
(1, NULL, 'received', 1, '2026-01-23 10:00:00', 'Order created'),
(1, 'received', 'waiting_for_process', 1, '2026-01-23 10:05:00', 'Order queued for processing'),
(1, 'waiting_for_process', 'in_wash', 3, '2026-01-23 11:00:00', 'Started washing'),
(1, 'in_wash', 'in_dry', 3, '2026-01-23 12:00:00', 'Started drying'),
(1, 'in_dry', 'in_fold', 3, '2026-01-23 13:30:00', 'Started folding'),
(1, 'in_fold', 'ready_for_qc', 3, '2026-01-23 14:00:00', 'Ready for quality check'),
(1, 'ready_for_qc', 'completed', 1, '2026-01-23 14:15:00', 'QC passed'),
(1, 'completed', 'ready_for_pickup', 1, '2026-01-23 14:20:00', 'Ready for customer pickup'),
(1, 'ready_for_pickup', 'closed', 1, '2026-01-25 09:30:00', 'Customer picked up order');

-- ============================================================================
-- INVENTORY TRANSACTIONS (sample stock movements)
-- ============================================================================

-- Initial stock in
INSERT INTO inventory_transactions (inventory_item_id, transaction_type, quantity, stock_before, stock_after, unit_cost, total_cost, reference_number, created_by, transaction_date) VALUES
(1, 'stock_in', 50.00, 0.00, 50.00, 15000.00, 750000.00, 'PO-2026-001', 1, '2026-01-20 09:00:00'),
(2, 'stock_in', 30.00, 0.00, 30.00, 25000.00, 750000.00, 'PO-2026-001', 1, '2026-01-20 09:00:00'),
(4, 'stock_in', 35.00, 0.00, 35.00, 18000.00, 630000.00, 'PO-2026-002', 1, '2026-01-20 10:00:00'),
(8, 'stock_in', 500, 0.00, 500, 500.00, 250000.00, 'PO-2026-003', 1, '2026-01-20 11:00:00');

-- Consumption for Order 1
INSERT INTO inventory_transactions (inventory_item_id, transaction_type, quantity, stock_before, stock_after, unit_cost, total_cost, order_id, created_by, transaction_date) VALUES
(1, 'consumption', 0.50, 50.00, 49.50, 15000.00, 7500.00, 1, 3, '2026-01-23 11:00:00'),
(4, 'consumption', 0.30, 35.00, 34.70, 18000.00, 5400.00, 1, 3, '2026-01-23 11:00:00'),
(8, 'consumption', 1, 500, 499, 500.00, 500.00, 1, 3, '2026-01-23 14:20:00');

-- ============================================================================
-- INVENTORY CONSUMPTION TRACKING
-- ============================================================================

INSERT INTO inventory_consumption (order_id, inventory_item_id, estimated_quantity, actual_quantity, variance, unit_cost, total_cost) VALUES
(1, 1, 0.50, 0.50, 0.00, 15000.00, 7500.00),
(1, 4, 0.30, 0.30, 0.00, 18000.00, 5400.00),
(1, 8, 1, 1, 0.00, 500.00, 500.00);

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
