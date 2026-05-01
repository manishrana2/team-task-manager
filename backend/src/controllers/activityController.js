const pool = require('../config/database');

// logs an action — fire and forget, never throw to caller
const log = async (user, action, entityType, entityId, detail = '') => {
  try {
    await pool.query(
      'INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, detail) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.name || user.email, action, entityType, entityId, detail]
    );
  } catch (err) {
    // don't break the request if logging fails
    console.error('Activity log error:', err.message);
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const [logs] = await pool.query(
      `SELECT id, user_name, action, entity_type, entity_id, detail, created_at
       FROM activity_logs
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json({ logs });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
  }
};

module.exports = { log, getActivityLogs };
