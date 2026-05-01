const express = require('express');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/', authenticateToken, getComments);
router.post('/', authenticateToken, addComment);
router.delete('/:commentId', authenticateToken, deleteComment);

module.exports = router;
