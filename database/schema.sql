CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('Admin', 'Member')) DEFAULT 'Member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_created_by ON projects(created_by);

CREATE TABLE project_members (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_pm_project_id ON project_members(project_id);
CREATE INDEX idx_pm_user_id ON project_members(user_id);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  project_id INT NOT NULL,
  assigned_to INT,
  status VARCHAR(50) CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE VIEW user_task_summary AS
SELECT 
  u.id,
  u.name,
  COUNT(CASE WHEN t.status = 'Todo' THEN 1 END) as todo_count,
  COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as done_count,
  COUNT(t.id) as total_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.name;

CREATE VIEW project_task_summary AS
SELECT 
  p.id,
  p.name,
  COUNT(CASE WHEN t.status = 'Todo' THEN 1 END) as todo_count,
  COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as done_count,
  COUNT(t.id) as total_tasks
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name;
