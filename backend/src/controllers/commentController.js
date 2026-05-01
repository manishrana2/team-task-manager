const pool = require('../config/database');

const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [comments] = await pool.query(
      `SELECT id, user_id, user_name, body, created_at
       FROM task_comments
       WHERE task_id = ?
       ORDER BY created_at ASC`,
      [taskId]
    );

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    // make sure task exists before adding comment
    const [task] = await pool.query('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (task.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO task_comments (task_id, user_id, user_name, body) VALUES (?, ?, ?, ?)',
      [taskId, req.user.id, req.user.name || req.user.email, body.trim()]
    );

    res.status(201).json({
      comment: {
        id: result.insertId,
        task_id: taskId,
        user_id: req.user.id,
        user_name: req.user.name || req.user.email,
        body: body.trim(),
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const [comments] = await pool.query(
      'SELECT id, user_id FROM task_comments WHERE id = ?',
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // only the author or an admin can delete
    if (comments[0].user_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    await pool.query('DELETE FROM task_comments WHERE id = ?', [commentId]);

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

module.exports = { getComments, addComment, deleteComment };
