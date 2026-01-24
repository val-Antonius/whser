-- =====================================================
-- Phase 2.2: Advanced Service Management Migration
-- =====================================================
-- This migration adds advanced service management features:
-- - Exception handling (stain treatment, delays, etc.)
-- - Batch processing for efficient operations
-- - Digital checklists per process stage
-- - Rewash/redo tracking as cost events
-- - SLA breach alerts
-- - Order aging and priority tracking
-- =====================================================

-- 1. Order Exceptions Table
-- Track exceptions that occur during order processing
CREATE TABLE IF NOT EXISTS order_exceptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  exception_type ENUM('stain_treatment', 'delay', 'damage', 'missing_item', 'other') NOT NULL,
  description TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'resolved', 'escalated') DEFAULT 'open',
  resolution_notes TEXT,
  reported_by INT,
  resolved_by INT,
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_exception (order_id),
  INDEX idx_exception_status (status),
  INDEX idx_exception_severity (severity),
  INDEX idx_exception_type (exception_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Processing Batches Table
-- Group orders for efficient batch processing
CREATE TABLE IF NOT EXISTS processing_batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  batch_type ENUM('wash', 'dry', 'iron', 'fold', 'mixed') NOT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  total_orders INT DEFAULT 0,
  total_weight DECIMAL(10,2) DEFAULT 0,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  notes TEXT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_batch_status (status),
  INDEX idx_batch_type (batch_type),
  INDEX idx_batch_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Batch Orders Junction Table
-- Link orders to processing batches
CREATE TABLE IF NOT EXISTS batch_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id INT NOT NULL,
  order_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  added_by INT,
  FOREIGN KEY (batch_id) REFERENCES processing_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_batch_order (batch_id, order_id),
  INDEX idx_batch (batch_id),
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Process Checklists Table
-- Define digital checklists for each service and process stage
CREATE TABLE IF NOT EXISTS process_checklists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT NOT NULL,
  process_stage ENUM('wash', 'dry', 'iron', 'fold', 'qc', 'pack') NOT NULL,
  checklist_item VARCHAR(255) NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  sequence_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_stage (service_id, process_stage),
  INDEX idx_sequence (sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Order Checklist Completion Table
-- Track checklist completion per order
CREATE TABLE IF NOT EXISTS order_checklist_completion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  checklist_id INT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_by INT,
  completed_at TIMESTAMP NULL,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (checklist_id) REFERENCES process_checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_order_checklist (order_id, checklist_id),
  INDEX idx_order (order_id),
  INDEX idx_completion_status (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Rewash Events Table
-- Track rewash/redo operations as cost events (NOT new orders)
CREATE TABLE IF NOT EXISTS rewash_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  reason TEXT NOT NULL,
  process_stage ENUM('wash', 'dry', 'iron', 'fold', 'all') NOT NULL,
  cost_impact DECIMAL(10,2) DEFAULT 0 COMMENT 'Estimated cost of rewash',
  authorized_by INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (authorized_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_rewash (order_id),
  INDEX idx_rewash_date (created_at),
  INDEX idx_process_stage (process_stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SLA Alerts Table
-- Track SLA breach alerts and notifications
CREATE TABLE IF NOT EXISTS sla_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  alert_type ENUM('approaching', 'breached', 'critical') NOT NULL,
  alert_message TEXT NOT NULL,
  hours_remaining DECIMAL(10,2),
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by INT,
  acknowledged_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_alert (order_id),
  INDEX idx_alert_status (is_acknowledged),
  INDEX idx_alert_type (alert_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Alter Orders Table
-- Add priority and aging tracking fields
ALTER TABLE orders
ADD COLUMN is_priority BOOLEAN DEFAULT FALSE AFTER priority;

ALTER TABLE orders
ADD COLUMN priority_reason TEXT AFTER is_priority;

ALTER TABLE orders
ADD COLUMN aging_hours DECIMAL(10,2) DEFAULT 0 COMMENT 'Hours since order creation' AFTER priority_reason;

ALTER TABLE orders
ADD COLUMN stage_aging_hours DECIMAL(10,2) DEFAULT 0 COMMENT 'Hours in current stage' AFTER aging_hours;

-- =====================================================
-- Sample Data for Testing
-- =====================================================

-- Sample process checklists for common services
-- Assuming service_id 1 = Wash & Fold, 2 = Dry Cleaning, 3 = Ironing

-- Wash & Fold Checklists
INSERT INTO process_checklists (service_id, process_stage, checklist_item, is_required, sequence_order) VALUES
(1, 'wash', 'Check pockets for items', TRUE, 1),
(1, 'wash', 'Separate colors from whites', TRUE, 2),
(1, 'wash', 'Check for stains', TRUE, 3),
(1, 'dry', 'Set appropriate temperature', TRUE, 1),
(1, 'dry', 'Check for shrinkage risk items', TRUE, 2),
(1, 'fold', 'Fold neatly', TRUE, 1),
(1, 'fold', 'Count items', TRUE, 2),
(1, 'qc', 'Verify cleanliness', TRUE, 1),
(1, 'qc', 'Check for damage', TRUE, 2),
(1, 'pack', 'Package securely', TRUE, 1);

-- Dry Cleaning Checklists
INSERT INTO process_checklists (service_id, process_stage, checklist_item, is_required, sequence_order) VALUES
(2, 'qc', 'Inspect for stains', TRUE, 1),
(2, 'qc', 'Check fabric type', TRUE, 2),
(2, 'qc', 'Tag delicate items', TRUE, 3),
(2, 'wash', 'Pre-treat stains', TRUE, 1),
(2, 'wash', 'Use appropriate solvent', TRUE, 2),
(2, 'dry', 'Air dry delicates', TRUE, 1),
(2, 'iron', 'Press at correct temperature', TRUE, 1),
(2, 'iron', 'Use steam for wrinkles', FALSE, 2),
(2, 'pack', 'Use protective covering', TRUE, 1);

-- Ironing Service Checklists
INSERT INTO process_checklists (service_id, process_stage, checklist_item, is_required, sequence_order) VALUES
(3, 'qc', 'Check fabric type', TRUE, 1),
(3, 'iron', 'Set correct temperature', TRUE, 1),
(3, 'iron', 'Iron collar and cuffs first', FALSE, 2),
(3, 'iron', 'Use starch if requested', FALSE, 3),
(3, 'pack', 'Hang or fold as requested', TRUE, 1);

-- =====================================================
-- Migration Complete
-- =====================================================
