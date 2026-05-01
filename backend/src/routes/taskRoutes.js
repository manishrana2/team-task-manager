const express = require('express');
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/taskController');
const commentRoutes = require('./commentRoutes');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { taskValidation, handleValidationErrors } = require('../utils/validation');

const router = express.Router();

router.post('/', authenticateToken, authorizeAdmin, taskValidation, handleValidationErrors, createTask);
router.get('/', authenticateToken, getAllTasks);
router.get('/stats/dashboard', authenticateToken, getDashboardStats);
router.get('/:taskId', authenticateToken, getTaskById);
router.put('/:taskId', authenticateToken, updateTask);
router.delete('/:taskId', authenticateToken, authorizeAdmin, deleteTask);

// nested comments under each task
router.use('/:taskId/comments', commentRoutes);

module.exports = router;
