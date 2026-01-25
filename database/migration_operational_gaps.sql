-- ============================================================================
-- MIGRATION: OPERATIONAL GAPS IMPROVEMENT
-- ============================================================================

-- 1. Service Materials (Recipe) Table
-- DEPRECATED: Replaced by `service_consumption_templates` from Migration Phase 2.3
-- CREATE TABLE IF NOT EXISTS service_materials (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     service_id INT NOT NULL,
--     inventory_item_id INT NOT NULL,
--     quantity DECIMAL(10,4) NOT NULL COMMENT 'Amount consumed per unit',
--     unit_type ENUM('per_kg', 'per_pc', 'per_order') NOT NULL DEFAULT 'per_kg',
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
--     FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
--     UNIQUE KEY unique_service_material (service_id, inventory_item_id)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Enhanced Rewash Events Table
-- Tracks rewash not just as an exception, but as a cost center
CREATE TABLE IF NOT EXISTS rewash_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    description TEXT,
    reported_by INT NOT NULL,  -- User ID
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Operational Impact
    cost_impact DECIMAL(10,2) DEFAULT 0 COMMENT 'Estimated cost of rewash',
    inventory_deducted BOOLEAN DEFAULT FALSE COMMENT 'Has inventory been auto-deducted?',
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Order Aging View
-- Pre-calculates aging metrics for the report to avoid complex ad-hoc queries
-- Uses TIMESTAMPDIFF for accurate hour calculation
CREATE VIEW view_order_aging AS
SELECT 
    o.id,
    o.order_number,
    o.current_status,
    o.is_priority,
    o.created_at,
    o.estimated_price,
    o.customer_id,
    o.service_id,
    
    -- Aging Calculations
    TIMESTAMPDIFF(HOUR, o.created_at, NOW()) as total_aging_hours,
    
    -- Status Grouping (Simplified for Reporting)
    CASE 
        WHEN o.current_status IN ('received', 'waiting_for_process') THEN 'Pending'
        WHEN o.current_status IN ('in_wash', 'in_dry', 'in_iron', 'in_fold') THEN 'Processing'
        WHEN o.current_status = 'ready_for_qc' THEN 'QC'
        WHEN o.current_status IN ('completed', 'ready_for_pickup') THEN 'Ready'
        ELSE 'Other'
    END as stage_group,

    -- Joins for Display
    c.name as customer_name,
    s.service_name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN services s ON o.service_id = s.id
WHERE o.current_status NOT IN ('closed', 'cancelled', 'deleted');
