-- Phase 2.4: Advanced Customer Features Migration

-- 1. Modify customers table to add loyalty and risk fields
-- Using conditional checks to avoid errors if columns already exist
SET @dbname = DATABASE();
SET @tablename = "customers";
SET @columnname = "loyalty_tier";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE customers ADD COLUMN loyalty_tier ENUM('Standard', 'Silver', 'Gold', 'Platinum') DEFAULT 'Standard';"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "total_lifetime_value";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE customers ADD COLUMN total_lifetime_value DECIMAL(10,2) DEFAULT 0.00;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "risk_score";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE customers ADD COLUMN risk_score INT DEFAULT 0 COMMENT '0-100, higher is riskier';"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Create customer_contracts table
CREATE TABLE IF NOT EXISTS customer_contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    contract_type ENUM('Corporate', 'Hotel', 'Dormitory', 'Other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sla_modifier_hours INT DEFAULT 0 COMMENT 'Negative value means faster SLA',
    price_modifier_percent DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Negative value means discount',
    billing_cycle ENUM('PerOrder', 'Monthly', 'Weekly') DEFAULT 'PerOrder',
    terms_and_conditions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_active (customer_id, is_active)
);

-- 3. Create customer_loyalty_history table
CREATE TABLE IF NOT EXISTS customer_loyalty_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NULL COMMENT 'Null if manual adjustment',
    change_type ENUM('Order', 'Bonus', 'Adjustment', 'Penalty', 'TierChange') NOT NULL,
    points_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Can be based on Spend or Weight',
    new_tier ENUM('Standard', 'Silver', 'Gold', 'Platinum') NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_customer_date (customer_id, created_at)
);

-- 4. Create customer_complaints table
CREATE TABLE IF NOT EXISTS customer_complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NULL,
    category ENUM('Damage', 'Delay', 'Service Quality', 'Billing', 'Other') NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Low',
    description TEXT NOT NULL,
    status ENUM('Open', 'In Progress', 'Resolved', 'Dismissed') DEFAULT 'Open',
    resolution_notes TEXT,
    resolved_at DATETIME NULL,
    created_by INT NULL COMMENT 'User ID who recorded it',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_customer (customer_id)
);

-- 5. Seed initial data (no seed needed for structure, but helps testing)
