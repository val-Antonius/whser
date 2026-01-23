-- ============================================================================
-- LAUNDRY MANAGEMENT PLATFORM - DATABASE SCHEMA
-- ============================================================================
-- Purpose: Complete MySQL schema for operational application
-- Version: 1.0
-- Created: 2026-01-23
-- ============================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS laundry_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE laundry_management;

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

-- Users table: Admin and Owner roles
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('admin', 'owner') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CUSTOMER MANAGEMENT
-- ============================================================================

-- Customers table: Customer master data
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  -- Customer segmentation
  segment ENUM('regular', 'vip', 'corporate', 'dormitory', 'hotel') DEFAULT 'regular',
  is_active BOOLEAN DEFAULT TRUE,
  -- Preferences and notes
  preferences TEXT COMMENT 'JSON field for customer preferences',
  notes TEXT COMMENT 'Persistent notes across orders',
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_customer_number (customer_number),
  INDEX idx_phone (phone),
  INDEX idx_segment (segment),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SERVICE MANAGEMENT
-- ============================================================================

-- Services table: Service type definitions
CREATE TABLE services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_code VARCHAR(50) UNIQUE NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  description TEXT,
  -- Service type and pricing
  service_type ENUM('regular', 'express', 'dry_clean', 'iron_only', 'wash_only') NOT NULL,
  unit_type ENUM('kg', 'piece') DEFAULT 'kg',
  base_price DECIMAL(10,2) NOT NULL,
  minimum_charge DECIMAL(10,2),
  -- SLA configuration
  estimated_hours INT NOT NULL COMMENT 'Standard completion time in hours',
  express_hours INT COMMENT 'Express service completion time',
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service_code (service_code),
  INDEX idx_service_type (service_type),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service processes table: Process steps per service (blueprint)
CREATE TABLE service_processes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT NOT NULL,
  process_name VARCHAR(100) NOT NULL,
  process_order INT NOT NULL COMMENT 'Sequence order of process',
  estimated_duration_minutes INT NOT NULL,
  -- Dependencies
  depends_on_process_id INT COMMENT 'Previous process that must complete first',
  is_required BOOLEAN DEFAULT TRUE,
  description TEXT,
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_process_id) REFERENCES service_processes(id),
  INDEX idx_service_id (service_id),
  INDEX idx_process_order (process_order),
  UNIQUE KEY unique_service_process_order (service_id, process_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ORDER MANAGEMENT (SINGLE SOURCE OF TRUTH)
-- ============================================================================

-- Orders table: Order header - the single source of truth
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  service_id INT NOT NULL,
  -- Order details
  estimated_weight DECIMAL(10,2),
  actual_weight DECIMAL(10,2),
  quantity INT COMMENT 'For piece-based services',
  unit_type ENUM('kg', 'piece') NOT NULL,
  -- Pricing
  estimated_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  -- Payment
  payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_method ENUM('cash', 'transfer', 'card', 'other'),
  -- Order status
  current_status ENUM(
    'received',
    'waiting_for_process',
    'in_wash',
    'in_dry',
    'in_iron',
    'in_fold',
    'ready_for_qc',
    'qc_failed',
    'completed',
    'ready_for_pickup',
    'closed',
    'cancelled'
  ) DEFAULT 'received',
  -- SLA tracking
  priority ENUM('regular', 'express') DEFAULT 'regular',
  estimated_completion DATETIME,
  actual_completion DATETIME,
  sla_breach BOOLEAN DEFAULT FALSE,
  -- Special handling
  special_instructions TEXT,
  exception_notes TEXT COMMENT 'Stain treatment, delays, etc.',
  is_rewash BOOLEAN DEFAULT FALSE,
  original_order_id INT COMMENT 'If this is a rewash order',
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  completed_by INT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (original_order_id) REFERENCES orders(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (completed_by) REFERENCES users(id),
  INDEX idx_order_number (order_number),
  INDEX idx_customer_id (customer_id),
  INDEX idx_service_id (service_id),
  INDEX idx_current_status (current_status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_priority (priority),
  INDEX idx_created_at (created_at),
  INDEX idx_estimated_completion (estimated_completion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items table: Line items per order (for complex orders)
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  item_description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order jobs table: Process jobs decomposed from order
CREATE TABLE order_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  service_process_id INT NOT NULL,
  job_name VARCHAR(100) NOT NULL,
  job_order INT NOT NULL COMMENT 'Sequence in workflow',
  -- Job status
  status ENUM('pending', 'in_progress', 'completed', 'failed', 'skipped') DEFAULT 'pending',
  -- Timing
  estimated_duration_minutes INT,
  actual_start_time DATETIME,
  actual_end_time DATETIME,
  actual_duration_minutes INT,
  -- Assignment
  assigned_to INT COMMENT 'User/operator assigned to this job',
  -- Exception handling
  exception_occurred BOOLEAN DEFAULT FALSE,
  exception_reason TEXT,
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (service_process_id) REFERENCES service_processes(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to),
  UNIQUE KEY unique_order_job_order (order_id, job_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order status log table: Complete audit trail of status changes
CREATE TABLE order_status_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  changed_by INT,
  reason TEXT COMMENT 'Reason for status change',
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id),
  INDEX idx_order_id (order_id),
  INDEX idx_changed_at (changed_at),
  INDEX idx_new_status (new_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INVENTORY MANAGEMENT
-- ============================================================================

-- Inventory items table: Inventory master data
CREATE TABLE inventory_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  description TEXT,
  -- Item classification
  category ENUM('detergent', 'softener', 'bleach', 'plastic', 'hanger', 'packaging', 'other') NOT NULL,
  unit_of_measure ENUM('liter', 'kg', 'piece', 'bottle', 'box') NOT NULL,
  -- Stock management
  current_stock DECIMAL(10,2) DEFAULT 0,
  minimum_stock DECIMAL(10,2) NOT NULL,
  reorder_quantity DECIMAL(10,2),
  -- Costing
  unit_cost DECIMAL(10,2),
  last_purchase_price DECIMAL(10,2),
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_code (item_code),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory transactions table: Stock movements
CREATE TABLE inventory_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inventory_item_id INT NOT NULL,
  transaction_type ENUM('stock_in', 'stock_out', 'adjustment', 'consumption', 'waste', 'loss') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  -- Before/after stock levels
  stock_before DECIMAL(10,2) NOT NULL,
  stock_after DECIMAL(10,2) NOT NULL,
  -- Transaction details
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reference_number VARCHAR(100) COMMENT 'PO number, invoice number, etc.',
  reason_code VARCHAR(50) COMMENT 'Reason for adjustment/waste/loss',
  notes TEXT,
  -- Related order (for consumption)
  order_id INT,
  -- Audit fields
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_inventory_item_id (inventory_item_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory consumption table: Estimated/actual usage per order
CREATE TABLE inventory_consumption (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  inventory_item_id INT NOT NULL,
  -- Consumption tracking
  estimated_quantity DECIMAL(10,2),
  actual_quantity DECIMAL(10,2),
  variance DECIMAL(10,2) COMMENT 'Actual - Estimated',
  -- Costing
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  INDEX idx_order_id (order_id),
  INDEX idx_inventory_item_id (inventory_item_id),
  UNIQUE KEY unique_order_inventory (order_id, inventory_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- POST-OPERATIONAL ANALYTICS (Phase 3 - Tables for future use)
-- ============================================================================

-- Data snapshots table: Period-based data freezing
CREATE TABLE data_snapshots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  snapshot_name VARCHAR(100) NOT NULL,
  period_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  snapshot_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  total_orders INT,
  total_revenue DECIMAL(10,2),
  metadata TEXT COMMENT 'JSON field for additional snapshot metadata',
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_period_type (period_type),
  INDEX idx_period_start (period_start),
  INDEX idx_is_locked (is_locked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytical metrics table: Calculated metrics per period
CREATE TABLE analytical_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  snapshot_id INT NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4),
  baseline_value DECIMAL(10,4),
  variance DECIMAL(10,4),
  variance_percentage DECIMAL(10,2),
  significance_level ENUM('normal', 'attention', 'critical') DEFAULT 'normal',
  metadata TEXT COMMENT 'JSON field for additional metric data',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snapshot_id) REFERENCES data_snapshots(id) ON DELETE CASCADE,
  INDEX idx_snapshot_id (snapshot_id),
  INDEX idx_metric_name (metric_name),
  INDEX idx_significance_level (significance_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insights table: Generated insights with context
CREATE TABLE insights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  snapshot_id INT NOT NULL,
  statement TEXT NOT NULL,
  severity ENUM('normal', 'attention', 'critical') DEFAULT 'normal',
  metrics_involved TEXT COMMENT 'JSON array of metric names',
  generated_by ENUM('system', 'llm', 'manual') NOT NULL,
  llm_confidence DECIMAL(3,2) COMMENT 'LLM confidence score if applicable',
  is_actionable BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (snapshot_id) REFERENCES data_snapshots(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_snapshot_id (snapshot_id),
  INDEX idx_severity (severity),
  INDEX idx_generated_by (generated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendations table: System recommendations
CREATE TABLE recommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  insight_id INT NOT NULL,
  action TEXT NOT NULL,
  category ENUM('sop', 'staffing', 'capacity', 'pricing', 'inventory', 'other') NOT NULL,
  urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
  rationale TEXT,
  generated_by ENUM('system', 'llm', 'manual') NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insight_id) REFERENCES insights(id) ON DELETE CASCADE,
  INDEX idx_insight_id (insight_id),
  INDEX idx_category (category),
  INDEX idx_urgency (urgency),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table: Managerial tasks
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  insight_id INT,
  recommendation_id INT,
  -- Assignment
  assigned_to INT NOT NULL COMMENT 'Admin user',
  created_by INT NOT NULL COMMENT 'Owner user',
  -- Priority and status
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'resolved', 'cancelled') DEFAULT 'open',
  -- Timing
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  -- Completion
  completion_notes TEXT,
  completion_period_id INT COMMENT 'Snapshot period when task was completed',
  -- Audit fields
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (insight_id) REFERENCES insights(id),
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (completion_period_id) REFERENCES data_snapshots(id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_by (created_by),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TRIGGERS FOR AUTOMATED OPERATIONS
-- ============================================================================

-- Trigger: Update inventory current_stock after transaction
DELIMITER //
CREATE TRIGGER after_inventory_transaction_insert
AFTER INSERT ON inventory_transactions
FOR EACH ROW
BEGIN
  UPDATE inventory_items
  SET current_stock = NEW.stock_after,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.inventory_item_id;
END//
DELIMITER ;

-- Trigger: Auto-log order status changes
DELIMITER //
CREATE TRIGGER after_order_status_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF OLD.current_status != NEW.current_status THEN
    INSERT INTO order_status_log (order_id, previous_status, new_status, changed_by, changed_at)
    VALUES (NEW.id, OLD.current_status, NEW.current_status, NEW.created_by, CURRENT_TIMESTAMP);
  END IF;
END//
DELIMITER ;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
