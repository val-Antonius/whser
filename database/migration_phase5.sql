-- ============================================================================
-- MIGRATION: PHASE 5 - TASK MANAGEMENT
-- ============================================================================

-- 1. Fix Insights Table 'generated_by' Column
-- Adding 'rule-based' to the ENUM to prevent data truncation
ALTER TABLE insights 
MODIFY COLUMN generated_by ENUM('system', 'llm', 'manual', 'rule-based') NOT NULL DEFAULT 'manual';

-- 2. Recommendations Table
-- Ensure it exists (if not created in Phase 4)
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    insight_id INT NOT NULL,
    action TEXT NOT NULL,
    category ENUM('sop', 'staffing', 'capacity', 'pricing', 'inventory', 'other') DEFAULT 'other',
    urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
    rationale TEXT,
    generated_by ENUM('system', 'llm', 'manual', 'rule-based') DEFAULT 'manual',
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (insight_id) REFERENCES insights(id) ON DELETE CASCADE,
    INDEX idx_insight (insight_id),
    INDEX idx_status (status),
    INDEX idx_urgency (urgency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tasks Table
-- As specified by Owner
CREATE TABLE IF NOT EXISTS tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  insight_id INT,
  recommendation_id INT,
  assigned_to INT, -- admin user_id
  created_by INT,  -- owner user_id
  priority ENUM('low', 'medium', 'high'),
  status ENUM('open', 'in_progress', 'resolved'),
  due_date DATE,
  created_at DATETIME,
  completed_at DATETIME,
  completion_notes TEXT,
  FOREIGN KEY (insight_id) REFERENCES insights(id),
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
