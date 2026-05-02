const express = require('express');
const {
  signup,
  login,
  getProfile,
  getAllUsers,
  createUser,
  updateUser,
  changeUserPassword,
  deleteUser,
  updateProfile,
} = require('../controllers/authController');
const {
  loginValidation,
  adminUserValidation,
  updateUserValidation,
  passwordValidation,
  handleValidationErrors,
} = require('../utils/validation');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);

router.post('/login', loginValidation, handleValidationErrors, login);

router.get('/profile', authenticateToken, getProfile);

router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);

router.post('/users', authenticateToken, authorizeAdmin, adminUserValidation, handleValidationErrors, createUser);

router.put('/users/:userId', authenticateToken, authorizeAdmin, updateUserValidation, handleValidationErrors, updateUser);

router.patch('/users/:userId/password', authenticateToken, authorizeAdmin, passwordValidation, handleValidationErrors, changeUserPassword);

router.delete('/users/:userId', authenticateToken, authorizeAdmin, deleteUser);

router.patch('/profile', authenticateToken, updateProfile);

module.exports = router;
