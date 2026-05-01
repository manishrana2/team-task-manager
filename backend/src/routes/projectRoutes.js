const express = require('express');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
} = require('../controllers/projectController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { projectValidation, handleValidationErrors } = require('../utils/validation');

const router = express.Router();

router.post('/', authenticateToken, authorizeAdmin, projectValidation, handleValidationErrors, createProject);

router.get('/', authenticateToken, getAllProjects);

router.get('/:projectId', authenticateToken, getProjectById);

router.put('/:projectId', authenticateToken, authorizeAdmin, projectValidation, handleValidationErrors, updateProject);

router.delete('/:projectId', authenticateToken, authorizeAdmin, deleteProject);

router.post('/:projectId/members', authenticateToken, authorizeAdmin, addProjectMember);

router.get('/:projectId/members', authenticateToken, getProjectMembers);

router.delete('/:projectId/members/:memberId', authenticateToken, authorizeAdmin, removeProjectMember);

module.exports = router;
