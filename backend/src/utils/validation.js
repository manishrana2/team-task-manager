const { body, validationResult } = require('express-validator');

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const adminUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['Admin', 'Member'])
    .withMessage('Valid role is required'),
];

const updateUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role')
    .isIn(['Admin', 'Member'])
    .withMessage('Valid role is required'),
];

const passwordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
];

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').trim().notEmpty().withMessage('Task description is required'),
  body('project_id').isInt().withMessage('Valid project ID is required'),
  body('assigned_to').optional({ checkFalsy: true }).isInt().withMessage('Valid user ID is required'),
  body('due_date').optional({ checkFalsy: true }).isISO8601().withMessage('Valid due date is required'),
  body('status')
    .optional()
    .isIn(['Todo', 'In Progress', 'Done'])
    .withMessage('Valid status is required'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  signupValidation,
  loginValidation,
  adminUserValidation,
  updateUserValidation,
  passwordValidation,
  projectValidation,
  taskValidation,
  handleValidationErrors,
};
