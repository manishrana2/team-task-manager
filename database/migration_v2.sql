-- Run this against your existing database to add new features
-- priority column for tasks
ALTER TABLE tasks ADD COLUMN priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium' AFTER status;

-- activity log table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(255),
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id INT,
  detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created_at (created_at),
  INDEX idx_entity (entity_type, entity_id)
);
