const express = require('express');
const { getActivityLogs } = require('../controllers/activityController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, authorizeAdmin, getActivityLogs);

module.exports = router;
