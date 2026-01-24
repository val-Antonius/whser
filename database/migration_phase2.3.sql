-- ============================================================================
-- PHASE 2.3: ADVANCED INVENTORY FEATURES - DATABASE MIGRATION
-- ============================================================================
-- Purpose: Add advanced inventory management capabilities
-- Features: Consumption templates, variance analysis, cost attribution,
--           waste tracking, bundling, usage reports, role restrictions
-- ============================================================================

-- 1. SERVICE CONSUMPTION TEMPLATES
-- Defines expected inventory consumption per service type
CREATE TABLE IF NOT EXISTS service_consumption_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    inventory_item_id INT NOT NULL,
    estimated_quantity DECIMAL(10,2) NOT NULL COMMENT 'Expected quantity consumed per order',
    unit VARCHAR(50) NOT NULL COMMENT 'Unit of measurement (ml, g, pieces, etc.)',
    notes TEXT COMMENT 'Additional notes about consumption',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_service_item (service_id, inventory_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Service-based inventory consumption templates';

-- 2. ORDER INVENTORY CONSUMPTION
-- Tracks actual inventory consumed per order
CREATE TABLE IF NOT EXISTS order_inventory_consumption (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    inventory_item_id INT NOT NULL,
    estimated_quantity DECIMAL(10,2) NOT NULL COMMENT 'Quantity from template',
    actual_quantity DECIMAL(10,2) NULL COMMENT 'Actual quantity used',
    variance DECIMAL(10,2) NULL COMMENT 'Difference (actual - estimated)',
    variance_percentage DECIMAL(5,2) NULL COMMENT 'Variance as percentage',
    unit VARCHAR(50) NOT NULL,
    transaction_id INT NULL COMMENT 'Link to inventory transaction',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INT NULL COMMENT 'User who recorded actual consumption',
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES inventory_transactions(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_item (inventory_item_id),
    INDEX idx_variance (variance_percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Actual inventory consumption per order';

-- 3. INVENTORY VARIANCE
-- Tracks significant variances requiring investigation
CREATE TABLE IF NOT EXISTS inventory_variance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consumption_id INT NOT NULL,
    variance_amount DECIMAL(10,2) NOT NULL,
    variance_percentage DECIMAL(5,2) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL COMMENT 'Based on percentage thresholds',
    status ENUM('pending', 'investigating', 'resolved') DEFAULT 'pending',
    investigation_notes TEXT,
    resolution_notes TEXT,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consumption_id) REFERENCES order_inventory_consumption(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_severity (severity),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Variance analysis and tracking';

-- 4. INVENTORY WASTE
-- Records waste/loss events with authorization
CREATE TABLE IF NOT EXISTS inventory_waste (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventory_item_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    waste_type ENUM('spillage', 'expiration', 'damage', 'theft', 'contamination', 'other') NOT NULL,
    reason TEXT NOT NULL COMMENT 'Detailed explanation required',
    cost_impact DECIMAL(10,2) NULL COMMENT 'Calculated cost of waste',
    reported_by INT NOT NULL,
    authorized_by INT NULL COMMENT 'Manager who authorized',
    authorization_code VARCHAR(255) NULL COMMENT 'Hashed authorization PIN',
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    INDEX idx_item (inventory_item_id),
    INDEX idx_type (waste_type),
    INDEX idx_reported (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Waste and loss tracking';

-- 5. INVENTORY BUNDLES
-- Groups multiple inventory items into bundles
CREATE TABLE IF NOT EXISTS inventory_bundles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bundle_name VARCHAR(255) NOT NULL,
    bundle_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_code (bundle_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Inventory item bundles';

-- 6. BUNDLE ITEMS
-- Junction table linking bundles to inventory items
CREATE TABLE IF NOT EXISTS bundle_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bundle_id INT NOT NULL,
    inventory_item_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    FOREIGN KEY (bundle_id) REFERENCES inventory_bundles(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bundle_item (bundle_id, inventory_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Items within bundles';

-- 7. ALTER INVENTORY TRANSACTIONS TABLE
-- Add cost tracking and order attribution (check if columns exist first)

-- Add cost_per_unit if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'inventory_transactions' 
AND COLUMN_NAME = 'cost_per_unit';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE inventory_transactions ADD COLUMN cost_per_unit DECIMAL(10,2) NULL COMMENT ''Unit cost at time of transaction'' AFTER quantity',
    'SELECT ''Column cost_per_unit already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add attributed_order_id if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'inventory_transactions' 
AND COLUMN_NAME = 'attributed_order_id';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE inventory_transactions ADD COLUMN attributed_order_id INT NULL COMMENT ''Order this transaction is attributed to'' AFTER notes',
    'SELECT ''Column attributed_order_id already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if it doesn't exist
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'inventory_transactions' 
AND CONSTRAINT_NAME = 'fk_attributed_order';

SET @query = IF(@fk_exists = 0,
    'ALTER TABLE inventory_transactions ADD CONSTRAINT fk_attributed_order FOREIGN KEY (attributed_order_id) REFERENCES orders(id) ON DELETE SET NULL',
    'SELECT ''Foreign key fk_attributed_order already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index if it doesn't exist
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'inventory_transactions' 
AND INDEX_NAME = 'idx_attributed_order';

SET @query = IF(@idx_exists = 0,
    'ALTER TABLE inventory_transactions ADD INDEX idx_attributed_order (attributed_order_id)',
    'SELECT ''Index idx_attributed_order already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Sample Consumption Templates for Wash & Fold Service
INSERT INTO service_consumption_templates (service_id, inventory_item_id, estimated_quantity, unit, notes)
SELECT 
    s.id,
    ii.id,
    CASE 
        WHEN ii.item_name LIKE '%Detergent%' THEN 50.00
        WHEN ii.item_name LIKE '%Softener%' THEN 30.00
        WHEN ii.item_name LIKE '%Bleach%' THEN 20.00
        ELSE 10.00
    END as estimated_quantity,
    ii.unit_of_measure,
    'Auto-generated template for testing'
FROM services s
CROSS JOIN inventory_items ii
WHERE s.service_name = 'Wash & Fold'
AND ii.category IN ('detergent', 'softener', 'bleach')
LIMIT 3;

-- Sample Consumption Templates for Dry Cleaning Service
INSERT INTO service_consumption_templates (service_id, inventory_item_id, estimated_quantity, unit, notes)
SELECT 
    s.id,
    ii.id,
    CASE 
        WHEN ii.item_name LIKE '%Solvent%' THEN 100.00
        WHEN ii.item_name LIKE '%Stain%' THEN 15.00
        ELSE 20.00
    END as estimated_quantity,
    ii.unit_of_measure,
    'Auto-generated template for dry cleaning'
FROM services s
CROSS JOIN inventory_items ii
WHERE s.service_name = 'Dry Cleaning'
AND ii.category IN ('detergent', 'bleach')
LIMIT 2;

-- Sample Bundle: Starter Kit
INSERT INTO inventory_bundles (bundle_name, bundle_code, description, created_by)
VALUES 
('Wash & Fold Starter Kit', 'WF-STARTER-001', 'Complete starter kit for wash and fold service', 1),
('Dry Clean Premium Kit', 'DC-PREMIUM-001', 'Premium dry cleaning supplies bundle', 1);

-- Sample Bundle Items
INSERT INTO bundle_items (bundle_id, inventory_item_id, quantity, unit)
SELECT 
    1 as bundle_id,
    ii.id,
    CASE 
        WHEN ii.item_name LIKE '%Detergent%' THEN 5000.00
        WHEN ii.item_name LIKE '%Softener%' THEN 3000.00
        WHEN ii.item_name LIKE '%Bleach%' THEN 2000.00
        ELSE 1000.00
    END as quantity,
    ii.unit_of_measure
FROM inventory_items ii
WHERE ii.category IN ('detergent', 'softener', 'bleach')
LIMIT 3;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT 
    'service_consumption_templates' as table_name,
    COUNT(*) as row_count
FROM service_consumption_templates
UNION ALL
SELECT 'order_inventory_consumption', COUNT(*) FROM order_inventory_consumption
UNION ALL
SELECT 'inventory_variance', COUNT(*) FROM inventory_variance
UNION ALL
SELECT 'inventory_waste', COUNT(*) FROM inventory_waste
UNION ALL
SELECT 'inventory_bundles', COUNT(*) FROM inventory_bundles
UNION ALL
SELECT 'bundle_items', COUNT(*) FROM bundle_items;

-- Verify inventory_transactions alterations
SHOW COLUMNS FROM inventory_transactions LIKE '%cost%';
SHOW COLUMNS FROM inventory_transactions LIKE '%attributed%';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
