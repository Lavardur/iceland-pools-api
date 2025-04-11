const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validate pool creation/update
const validatePool = [
  body('name')
    .notEmpty().withMessage('Pool name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
  
  body('latitude')
    .optional()
    .isFloat({ min: 63, max: 67 }).withMessage('Latitude must be a valid coordinate in Iceland (63-67)'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -24, max: -13 }).withMessage('Longitude must be a valid coordinate in Iceland (-24 to -13)'),
  
  body('entry_fee')
    .optional()
    .isInt({ min: 0 }).withMessage('Entry fee must be a positive number'),
  
  body('website')
    .optional()
    .isURL().withMessage('Website must be a valid URL'),
  
  handleValidationErrors
];

// Validate review creation
const validateReview = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
  
  body('comment')
    .optional()
    .isLength({ max: 500 }).withMessage('Comment must be less than 500 characters'),
  
  body('pool_id')
    .notEmpty().withMessage('Pool ID is required')
    .isInt().withMessage('Pool ID must be an integer'),
  
  handleValidationErrors
];

// Validate user registration
const validateUser = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must contain only letters, numbers and underscores'),
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

// Validate ID parameter
const validateId = [
  param('id')
    .isInt().withMessage('ID must be an integer'),
  
  handleValidationErrors
];

module.exports = {
  validatePool,
  validateReview,
  validateUser,
  validateId
};