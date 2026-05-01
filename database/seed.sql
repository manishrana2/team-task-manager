INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@example.com', '$2a$10$xvAdLuPrtAjSnTeidg9KdOnXtBMRniYBwPBUCp5DEs.wijGQ9Ssb2', 'Admin'),
('John Doe', 'john@example.com', '$2a$10$xvAdLuPrtAjSnTeidg9KdOnXtBMRniYBwPBUCp5DEs.wijGQ9Ssb2', 'Member'),
('Jane Smith', 'jane@example.com', '$2a$10$xvAdLuPrtAjSnTeidg9KdOnXtBMRniYBwPBUCp5DEs.wijGQ9Ssb2', 'Member');

INSERT INTO projects (name, description, created_by) VALUES
('Website Redesign', 'Redesign the company website', 1),
('Mobile App', 'Build a new mobile application', 1),
('API Development', 'Develop RESTful APIs', 1);

INSERT INTO project_members (project_id, user_id) VALUES
(1, 2),
(1, 3),
(2, 2),
(3, 3);

INSERT INTO tasks (title, description, project_id, assigned_to, status, due_date) VALUES
('Setup project structure', 'Create initial project folders and files', 1, 2, 'Done', '2026-05-05'),
('Design homepage', 'Create homepage design mockup', 1, 3, 'In Progress', '2026-05-10'),
('User authentication', 'Implement user login and signup', 2, 2, 'Todo', '2026-05-15'),
('Database design', 'Design database schema', 3, 3, 'In Progress', '2026-05-12'),
('API documentation', 'Write API documentation', 3, NULL, 'Todo', '2026-05-20');
