const pool = require('../config/database');
const { log } = require('./activityController');

const VALID_STATUSES = ['Todo', 'In Progress', 'Done'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

const isValidStatus = (status) => VALID_STATUSES.includes(status);
const isValidPriority = (priority) => VALID_PRIORITIES.includes(priority);

const isProjectMember = async (projectId, userId) => {
  const [members] = await pool.query(
    'SELECT id FROM project_members WHERE project_id = ? AND user_id = ? LIMIT 1',
    [projectId, userId]
  );

  return members.length > 0;
};

const createTask = async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, due_date, status, priority } = req.body;

    const [project] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [project_id]
    );

    if (project.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (assigned_to) {
      const [user] = await pool.query(
        'SELECT * FROM users WHERE id = ? AND role = ?',
        [assigned_to, 'Member']
      );

      if (user.length === 0) {
        return res.status(404).json({ message: 'Assigned member not found' });
      }

      if (!(await isProjectMember(project_id, assigned_to))) {
        return res.status(400).json({ message: 'Assigned user must be a member of the project' });
      }
    }

    if (status && !isValidStatus(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    if (priority && !isValidPriority(priority)) {
      return res.status(400).json({ message: 'Invalid task priority' });
    }

    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, project_id, assigned_to, due_date, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, project_id, assigned_to || null, due_date || null, status || 'Todo', priority || 'Medium']
    );

    await log(req.user, 'create', 'task', result.insertId, `Created task "${title}"`);

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: result.insertId,
        title,
        description,
        project_id,
        assigned_to: assigned_to || null,
        due_date: due_date || null,
        status: status || 'Todo',
        priority: priority || 'Medium',
      },
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { status, projectId, assignedTo, priority } = req.query;

    let query = `SELECT DISTINCT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id`;
    const where = [];
    const params = [];

    if (req.user.role === 'Member') {
      query += ' LEFT JOIN project_members pm ON p.id = pm.project_id';
      where.push('(t.assigned_to = ? OR pm.user_id = ? OR p.created_by = ?)');
      params.push(req.user.id, req.user.id, req.user.id);
    }

    if (status) {
      where.push('t.status = ?');
      params.push(status);
    }

    if (projectId) {
      where.push('t.project_id = ?');
      params.push(projectId);
    }

    if (priority) {
      where.push('t.priority = ?');
      params.push(priority);
    }

    if (assignedTo && req.user.role === 'Admin') {
      where.push('t.assigned_to = ?');
      params.push(assignedTo);
    }

    if (where.length > 0) {
      query += ` WHERE ${where.join(' AND ')}`;
    }

    query += ` ORDER BY CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END, t.due_date ASC`;

    const [tasks] = await pool.query(query, params);

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [tasks] = await pool.query(
      'SELECT t.*, p.name as project_name, u.name as assigned_to_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?',
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== 'Admin' && tasks[0].assigned_to !== req.user.id) {
      // Check if they have project access
      const [members] = await pool.query(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
        [tasks[0].project_id, req.user.id]
      );
      const [project] = await pool.query('SELECT created_by FROM projects WHERE id = ?', [tasks[0].project_id]);
      
      const isCreator = project.length > 0 && project[0].created_by === req.user.id;
      
      if (members.length === 0 && !isCreator) {
        return res.status(403).json({ message: 'Permission denied' });
      }
    }

    res.json({ task: tasks[0] });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assigned_to, due_date, status, priority } = req.body;

    const [existingTask] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    if (existingTask.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== 'Admin' && existingTask[0].assigned_to !== req.user.id) {
      // Check if they have project access to update status
      const [members] = await pool.query(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
        [existingTask[0].project_id, req.user.id]
      );
      const [project] = await pool.query('SELECT created_by FROM projects WHERE id = ?', [existingTask[0].project_id]);
      
      const isCreator = project.length > 0 && project[0].created_by === req.user.id;
      
      if (members.length === 0 && !isCreator) {
        return res.status(403).json({ message: 'Permission denied' });
      }
    }

    if (status !== undefined && !isValidStatus(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    if (priority !== undefined && !isValidPriority(priority)) {
      return res.status(400).json({ message: 'Invalid task priority' });
    }

    // members can only update status
    if (req.user.role !== 'Admin' && (
      title !== undefined ||
      description !== undefined ||
      assigned_to !== undefined ||
      due_date !== undefined ||
      priority !== undefined
    )) {
      return res.status(403).json({ message: 'Members can update task status only' });
    }

    if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
      const [user] = await pool.query(
        'SELECT * FROM users WHERE id = ? AND role = ?',
        [assigned_to, 'Member']
      );

      if (user.length === 0) {
        return res.status(404).json({ message: 'Assigned member not found' });
      }

      if (!(await isProjectMember(existingTask[0].project_id, assigned_to))) {
        return res.status(400).json({ message: 'Assigned user must be a member of the project' });
      }
    }

    const updateQuery = [];
    const updateParams = [];

    if (title !== undefined) { updateQuery.push('title = ?'); updateParams.push(title); }
    if (description !== undefined) { updateQuery.push('description = ?'); updateParams.push(description); }
    if (assigned_to !== undefined) { updateQuery.push('assigned_to = ?'); updateParams.push(assigned_to || null); }
    if (due_date !== undefined) { updateQuery.push('due_date = ?'); updateParams.push(due_date || null); }
    if (status !== undefined) { updateQuery.push('status = ?'); updateParams.push(status); }
    if (priority !== undefined) { updateQuery.push('priority = ?'); updateParams.push(priority); }

    if (updateQuery.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateParams.push(taskId);

    await pool.query(
      `UPDATE tasks SET ${updateQuery.join(', ')} WHERE id = ?`,
      updateParams
    );

    const changes = [];
    if (status !== undefined && status !== existingTask[0].status) changes.push(`status → ${status}`);
    if (priority !== undefined && priority !== existingTask[0].priority) changes.push(`priority → ${priority}`);
    if (title !== undefined) changes.push('title updated');

    await log(req.user, 'update', 'task', taskId,
      `Updated task "${existingTask[0].title}"${changes.length ? ': ' + changes.join(', ') : ''}`
    );

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [existingTask] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );

    if (existingTask.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    await log(req.user, 'delete', 'task', taskId, `Deleted task "${existingTask[0].title}"`);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let joinClause = '';
    let whereClause = '';
    const params = [];

    if (userRole === 'Member') {
      joinClause = 'LEFT JOIN project_members pm ON tasks.project_id = pm.project_id LEFT JOIN projects p ON tasks.project_id = p.id';
      whereClause = 'WHERE tasks.assigned_to = ? OR pm.user_id = ? OR p.created_by = ?';
      params.push(userId, userId, userId);
    }

    // Use DISTINCT if we join project_members
    const query = userRole === 'Member'
      ? `SELECT
          COUNT(DISTINCT tasks.id) AS totalTasks,
          SUM(CASE WHEN tasks.status = 'Done' THEN 1 ELSE 0 END) AS completedTasks,
          SUM(CASE WHEN tasks.status != 'Done' THEN 1 ELSE 0 END) AS pendingTasks,
          SUM(CASE WHEN tasks.status = 'In Progress' THEN 1 ELSE 0 END) AS inProgressTasks,
          SUM(CASE WHEN tasks.status = 'Todo' THEN 1 ELSE 0 END) AS todoTasks,
          SUM(CASE WHEN tasks.due_date IS NOT NULL AND tasks.due_date < ? AND tasks.status != 'Done' THEN 1 ELSE 0 END) AS overdueTasks,
          SUM(CASE WHEN tasks.priority = 'High' AND tasks.status != 'Done' THEN 1 ELSE 0 END) AS highPriorityPending
         FROM (
           SELECT DISTINCT tasks.*
           FROM tasks
           ${joinClause}
           ${whereClause}
         ) as tasks`
      : `SELECT
          COUNT(*) AS totalTasks,
          SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) AS completedTasks,
          SUM(CASE WHEN status != 'Done' THEN 1 ELSE 0 END) AS pendingTasks,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS inProgressTasks,
          SUM(CASE WHEN status = 'Todo' THEN 1 ELSE 0 END) AS todoTasks,
          SUM(CASE WHEN due_date IS NOT NULL AND due_date < ? AND status != 'Done' THEN 1 ELSE 0 END) AS overdueTasks,
          SUM(CASE WHEN priority = 'High' AND status != 'Done' THEN 1 ELSE 0 END) AS highPriorityPending
         FROM tasks`;

    const queryParams = userRole === 'Member' ? [now, ...params] : [now];

    const [[totals]] = await pool.query(query, queryParams);

    res.json({
      stats: {
        totalTasks: totals.totalTasks || 0,
        completedTasks: totals.completedTasks || 0,
        pendingTasks: totals.pendingTasks || 0,
        inProgressTasks: totals.inProgressTasks || 0,
        todoTasks: totals.todoTasks || 0,
        overdueTasks: totals.overdueTasks || 0,
        highPriorityPending: totals.highPriorityPending || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats,
};
