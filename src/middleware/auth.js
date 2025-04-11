const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and has the right format
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');

      // Find user by ID (excluding password)
      req.user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password_hash'] }
      });

      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      res.status(401).json({ error: 'Not authorized, invalid token' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized, admin access required' });
  }
};

module.exports = {
  protect,
  adminOnly
};