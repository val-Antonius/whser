-- ============================================================================
-- PHASE 2.1: ADVANCED POS FEATURES - DATABASE MIGRATION
-- ============================================================================
-- Purpose: Add tables and columns for advanced transaction management
-- ============================================================================

-- Payment Transactions Table
-- Track all payment events with complete audit trail
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  transaction_type ENUM('payment', 'refund', 'deposit', 'adjustment') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash', 'transfer', 'card', 'other'),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_payment (order_id),
  INDEX idx_transaction_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Cancellations Table
-- Track cancellation events with authorization and reason
CREATE TABLE IF NOT EXISTS order_cancellations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  cancellation_reason TEXT NOT NULL,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  authorized_by VARCHAR(100),
  authorization_code VARCHAR(50),
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_by INT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_cancellation (order_id),
  INDEX idx_cancelled_date (cancelled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Voids Table
-- Track voided transactions with reason and authorization
CREATE TABLE IF NOT EXISTS order_voids (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  void_reason TEXT NOT NULL,
  original_amount DECIMAL(10,2),
  authorized_by VARCHAR(100),
  authorization_code VARCHAR(50),
  voided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  voided_by INT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (voided_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_void (order_id),
  INDEX idx_voided_date (voided_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alter Orders Table
-- Add fields for advanced payment and pricing tracking
-- Note: If columns already exist, these statements will fail. That's okay for re-running migration.

-- Add deposit_amount column
ALTER TABLE orders
ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0 AFTER paid_amount;

-- Add balance_due column
ALTER TABLE orders
ADD COLUMN balance_due DECIMAL(10,2) DEFAULT 0 AFTER deposit_amount;

-- Add minimum_charge_applied column
ALTER TABLE orders
ADD COLUMN minimum_charge_applied BOOLEAN DEFAULT FALSE AFTER balance_due;

-- Add pricing_notes column
ALTER TABLE orders
ADD COLUMN pricing_notes TEXT AFTER minimum_charge_applied;

-- Add is_voided column
ALTER TABLE orders
ADD COLUMN is_voided BOOLEAN DEFAULT FALSE AFTER is_rewash;

-- Add voided_at column
ALTER TABLE orders
ADD COLUMN voided_at TIMESTAMP NULL AFTER is_voided;

-- Add parent_order_id column
ALTER TABLE orders
ADD COLUMN parent_order_id INT NULL COMMENT 'For split orders' AFTER original_order_id;

-- Add is_combined column
ALTER TABLE orders
ADD COLUMN is_combined BOOLEAN DEFAULT FALSE COMMENT 'If this is a combined order' AFTER parent_order_id;

-- Add foreign key for parent_order_id if it doesn't exist
-- Note: This will fail silently if the constraint already exists
ALTER TABLE orders
ADD CONSTRAINT fk_parent_order 
FOREIGN KEY (parent_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new tables exist
SELECT 'payment_transactions' as table_name, COUNT(*) as row_count FROM payment_transactions
UNION ALL
SELECT 'order_cancellations', COUNT(*) FROM order_cancellations
UNION ALL
SELECT 'order_voids', COUNT(*) FROM order_voids;

-- Verify new columns in orders table
DESCRIBE orders;

-- ============================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- ============================================================================

-- Example: Record a deposit payment
-- INSERT INTO payment_transactions 
-- (order_id, transaction_type, amount, payment_method, notes, created_by)
-- VALUES (1, 'deposit', 50000, 'cash', 'Initial deposit', 1);

-- Example: Cancel an order
-- INSERT INTO order_cancellations
-- (order_id, cancellation_reason, refund_amount, authorized_by, cancelled_by)
-- VALUES (1, 'Customer requested cancellation', 50000, 'Manager', 1);
