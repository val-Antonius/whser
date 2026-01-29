CREATE TABLE IF NOT EXISTS task_effectiveness (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    before_value DECIMAL(10, 2),
    after_value DECIMAL(10, 2),
    percentage_change DECIMAL(10, 2),
    is_effective BOOLEAN,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
