-- Run this against your existing database to add new features
-- priority column for tasks
ALTER TABLE tasks ADD COLUMN priority VARCHAR(50) CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium';

-- activity log table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(255),
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id INT,
  detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
