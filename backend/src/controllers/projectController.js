const pool = require('../config/database');
const { log } = require('./activityController');

const canAccessProject = async (projectId, user) => {
  if (user.role === 'Admin') {
    return true;
  }

  const [projects] = await pool.query(
    `SELECT p.id
     FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.id = ? AND (p.created_by = ? OR pm.user_id = ?)
     LIMIT 1`,
    [projectId, user.id, user.id]
  );

  return projects.length > 0;
};

const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    const createdBy = req.user.id;

    const [result] = await pool.query(
      'INSERT INTO projects (name, created_by) VALUES (?, ?)',
      [name, createdBy]
    );

    await log(req.user, 'create', 'project', result.insertId, `Created project "${name}"`);

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: result.insertId,
        name,
        created_by: createdBy,
      },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    let query = 'SELECT DISTINCT p.*, u.name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id';
    const params = [];

    if (req.user.role !== 'Admin') {
      query += ' LEFT JOIN project_members pm ON p.id = pm.project_id WHERE p.created_by = ? OR pm.user_id = ?';
      params.push(req.user.id, req.user.id);
    }

    query += ' ORDER BY p.created_at DESC';

    const [projects] = await pool.query(query, params);

    if (projects.length === 0) {
      return res.json({ projects: [] });
    }

    // fetch task stats for all projects in one query instead of N queries
    const projectIds = projects.map((p) => p.id);
    const [taskStats] = await pool.query(
      `SELECT project_id,
              COUNT(*) AS task_count,
              SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) AS done_count
       FROM tasks
       WHERE project_id = ANY($1)
       GROUP BY project_id`,
      [projectIds]
    );

    const statsMap = {};
    taskStats.forEach((row) => {
      statsMap[row.project_id] = {
        task_count: row.task_count || 0,
        done_count: row.done_count || 0,
      };
    });

    const enriched = projects.map((p) => {
      const s = statsMap[p.id] || { task_count: 0, done_count: 0 };
      return {
        ...p,
        task_count: s.task_count,
        done_count: s.done_count,
        progress: s.task_count > 0 ? Math.round((s.done_count / s.task_count) * 100) : 0,
      };
    });

    res.json({ projects: enriched });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const [projects] = await pool.query(
      'SELECT p.*, u.name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.id = ?',
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!(await canAccessProject(projectId, req.user))) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    res.json({ project: projects[0] });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    const [existingProject] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );

    if (existingProject.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (existingProject[0].created_by !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    await pool.query(
      'UPDATE projects SET name = ? WHERE id = ?',
      [name, projectId]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const [existingProject] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );

    if (existingProject.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (existingProject[0].created_by !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Cascading deletes handled by FK constraints in schema
    await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    const [project] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );

    if (project.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const [user] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0 || user[0].role !== 'Member') {
      return res.status(404).json({ message: 'User not found' });
    }

    const [existingMember] = await pool.query(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({ message: 'User already added to project' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
      [projectId, userId]
    );

    await log(req.user, 'update', 'project', projectId, `Added member "${user[0].name}" to project`);

    res.json({ message: 'Member added to project successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!(await canAccessProject(projectId, req.user))) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const [members] = await pool.query(
      'SELECT u.id, u.name, u.email, u.role FROM users u INNER JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = ?',
      [projectId]
    );

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    const [result] = await pool.query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, memberId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member not found in project' });
    }

    res.json({ message: 'Member removed from project successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
};
