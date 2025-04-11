const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Sequelize } = require('../models/index');
const { authLimit } = require('../middleware/rateLimit');
const { body, validationResult } = require('express-validator');

// Apply stricter rate limiting to auth routes
router.use(authLimit);

// Login validation
const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Login route
router.post('/login', validateLogin, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        isAdmin: user.is_admin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Registration with validators imported from middleware/validators.js
const { validateUser } = require('../middleware/validators');

router.post('/register', validateUser, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this username or email' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      is_admin: false // Default to regular user
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;