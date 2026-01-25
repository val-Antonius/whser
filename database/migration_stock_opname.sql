-- ============================================================================
-- MIGRATION: STOCK OPNAME (PHYSICAL COUNT)
-- ============================================================================

-- 1. Stock Opnames Table
-- Tracks the globally scheduled stock counting sessions
CREATE TABLE IF NOT EXISTS stock_opnames (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opname_number VARCHAR(50) UNIQUE NOT NULL, -- Format: OPN-YYYYMM-XXX
    status ENUM('open', 'submitted', 'cancelled') DEFAULT 'open',
    notes TEXT,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Stock Opname Items
-- Snapshot of system stock vs actual physical stock
CREATE TABLE IF NOT EXISTS stock_opname_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opname_id INT NOT NULL,
    inventory_item_id INT NOT NULL,
    
    -- Snapshot Data
    system_qty DECIMAL(10,2) NOT NULL COMMENT 'Stock level in system at moment of creation',
    actual_qty DECIMAL(10,2) NULL COMMENT 'Physical count entered by user',
    
    -- Analysis
    variance DECIMAL(10,2) GENERATED ALWAYS AS (IFNULL(actual_qty, system_qty) - system_qty) STORED COMMENT 'Actual - System',
    
    notes TEXT,
    
    FOREIGN KEY (opname_id) REFERENCES stock_opnames(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
    UNIQUE KEY unique_opname_item (opname_id, inventory_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
