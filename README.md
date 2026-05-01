# Task Manage — Engineering Workspace

![Task Manage](/frontend/public/favicon.ico) <!-- You can replace this with a real screenshot URL later -->

A highly performant, full-stack project and task management application designed for agile software engineering teams. Built with a focus on speed, clear role-based access control, and actionable analytics.

---

## 🎯 Overview

Task Manage is an opinionated issue tracking tool designed to eliminate the bloat of traditional project management software. It provides a focused workspace where teams can create projects, assign tasks, track completion percentages, and maintain a rigorous audit trail of all actions.

### Key Capabilities
- **Role-Based Access Control (RBAC):** Strict separation of concerns between `Admin` (full system control, user provisioning) and `Member` (project-scoped task execution).
- **Project Workspaces:** Isolated project environments with dedicated team assignments and real-time progress tracking.
- **Task Lifecycle:** Complete task tracking with priorities (Low/Medium/High), status boards (Todo, In Progress, Done), due dates, and inline comment threads.
- **Audit Logging:** System-wide, immutable activity tracking for security and accountability.
- **Analytics Dashboard:** Real-time metrics visualizing team velocity, overdue tasks, and priority distribution.

---

## 🛠 Tech Stack

**Frontend Architecture (Client)**
- **Framework:** Next.js 14 (App Router)
- **Styling:** Vanilla CSS (CSS Variables) + Tailwind CSS (Utility classes)
- **State Management:** React Hooks
- **Data Visualization:** Recharts
- **UX Polish:** React Hot Toast, Custom Dark Mode implementation

**Backend Architecture (API)**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL 2 (Relational)
- **Authentication:** JSON Web Tokens (JWT) & bcrypt (Password Hashing)
- **Validation:** express-validator

---

## 🗄️ Database Schema

The application uses a normalized relational database design to ensure data integrity.

- `users`: Core identity table (id, name, email, password_hash, role)
- `projects`: Project containers (id, name, created_by)
- `project_members`: Join table linking users to specific projects
- `tasks`: Work items (id, title, description, project_id, assigned_to, status, priority, due_date)
- `task_comments`: Collaboration threads tied to specific tasks
- `activity_logs`: Immutable audit trail for system events

*(Note: Ensure all migrations in the `/database` directory are run sequentially during initial setup).*

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)

### 1. Database Setup
1. Create a local MySQL database named `team_task_manager`.
2. Execute the schema migrations located in the `database/` folder in order (`migration_v1.sql`, `migration_v2.sql`, `migration_v3.sql`).

### 2. Backend Initialization
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=team_task_manager
JWT_SECRET=your_super_secret_jwt_key
```
Start the API server:
```bash
npm run dev
```

### 3. Frontend Initialization
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```
Start the development server:
```bash
npm run dev
```

### 4. First Login
The application disables public signup by design for security. You must manually insert your first Admin user into the database or use the initial seed script if provided.
Log in at `http://localhost:3001` using your admin credentials.

---

## 🔐 Security Decisions
- **No Public Signup:** To prevent unauthorized access, user provisioning is strictly handled by Admins via the internal `/users` portal.
- **Password Protection:** Passwords are cryptographically hashed using `bcrypt` before database insertion.
- **Stateless Auth:** Sessions are managed securely via JWTs stored in HTTP headers and client-side cookies.
- **Atomic Operations:** Deleting projects or users is protected by database cascading rules and transaction boundaries where applicable.

---

## 📜 License
This project was built as a proprietary assignment. Unauthorized reproduction or commercial use without explicit permission is prohibited.
