-- ============================================================================
-- ANALYTICS TABLES MIGRATION
-- ============================================================================
-- Purpose: Create tables for post-operational analytics and data snapshots
-- Phase: 3.1 - Data Snapshot System
-- ============================================================================

-- Data Snapshots Table
-- Stores metadata about frozen periods for analysis
CREATE TABLE IF NOT EXISTS data_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    snapshot_name VARCHAR(255) NOT NULL,
    period_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    snapshot_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT TRUE,
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    metadata JSON,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_period (period_type, period_start, period_end),
    INDEX idx_period_type (period_type),
    INDEX idx_period_dates (period_start, period_end),
    INDEX idx_locked (is_locked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytical Metrics Table
-- Stores calculated metrics for each snapshot
CREATE TABLE IF NOT EXISTS analytical_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    snapshot_id INT NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    baseline_value DECIMAL(15,4),
    variance DECIMAL(15,4),
    variance_percentage DECIMAL(8,2),
    significance_level ENUM('normal', 'attention', 'critical') DEFAULT 'normal',
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snapshot_id) REFERENCES data_snapshots(id) ON DELETE CASCADE,
    INDEX idx_snapshot_metric (snapshot_id, metric_name),
    INDEX idx_significance (significance_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insights Table
-- Stores generated insights (manual or LLM-generated)
CREATE TABLE IF NOT EXISTS insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    snapshot_id INT NOT NULL,
    statement TEXT NOT NULL,
    severity ENUM('normal', 'attention', 'critical') DEFAULT 'normal',
    metrics_involved JSON,
    generated_by ENUM('system', 'llm', 'manual') DEFAULT 'manual',
    llm_confidence DECIMAL(5,2),
    is_actionable BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (snapshot_id) REFERENCES data_snapshots(id) ON DELETE CASCADE,
    INDEX idx_snapshot (snapshot_id),
    INDEX idx_severity (severity),
    INDEX idx_generated_by (generated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendations Table
-- Stores actionable recommendations linked to insights
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    insight_id INT NOT NULL,
    action TEXT NOT NULL,
    category ENUM('sop', 'staffing', 'capacity', 'pricing', 'inventory', 'other') DEFAULT 'other',
    urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
    rationale TEXT,
    generated_by ENUM('system', 'llm', 'manual') DEFAULT 'manual',
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (insight_id) REFERENCES insights(id) ON DELETE CASCADE,
    INDEX idx_insight (insight_id),
    INDEX idx_status (status),
    INDEX idx_urgency (urgency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks Table (already exists in types, adding for completeness)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    insight_id INT,
    recommendation_id INT,
    assigned_to INT NOT NULL,
    created_by INT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'cancelled') DEFAULT 'open',
    due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    completion_notes TEXT,
    completion_period_id INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (insight_id) REFERENCES insights(id) ON DELETE SET NULL,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL,
    FOREIGN KEY (completion_period_id) REFERENCES data_snapshots(id) ON DELETE SET NULL,
    INDEX idx_assigned (assigned_to),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
