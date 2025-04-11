require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// Import models and middleware
const { Pool, Facility, User, Review, sequelize } = require('./models/index');
const { baseLimit, authLimit } = require('./middleware/rateLimit');
const { validatePool, validateReview, validateId } = require('./middleware/validators');
const { protect, adminOnly } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

app.use(cors());
app.use(express.json());

// Apply rate limiting to all requests (disable for testing)
if (process.env.NODE_ENV !== 'test') {
  app.use(baseLimit);
}

// Connect to PostgreSQL via Sequelize
// Only connect if not testing
if (process.env.NODE_ENV !== 'test') {
  sequelize.sync() // Creates tables if they don't exist
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Unable to connect to database:', err));
}

// Use auth routes
app.use('/api/auth', authRoutes);

// Define routes
// GET all pools
app.get('/api/pools', async (req, res) => {
  try {
    const pools = await Pool.findAll({
      include: [Facility]
    });
    res.json(pools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET pool by ID with validation
app.get('/api/pools/:id', validateId, async (req, res) => {
  try {
    const pool = await Pool.findByPk(req.params.id, {
      include: [
        Facility,
        {
          model: Review,
          include: [
            {
              model: User,
              attributes: ['username'] // Only show the username, not password or email
            }
          ]
        }
      ]
    });
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    res.json(pool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET reviews for a specific pool
app.get('/api/pools/:id/reviews', validateId, async (req, res) => {
  try {
    const pool = await Pool.findByPk(req.params.id);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    const reviews = await Review.findAll({
      where: { pool_id: req.params.id },
      include: [{
        model: User,
        attributes: ['username']
      }]
    });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new pool with validation - Admin only
app.post('/api/pools', protect, adminOnly, validatePool, async (req, res) => {
  try {
    const { facilities, ...poolData } = req.body;
    
    const newPool = await Pool.create(poolData);
    
    if (facilities) {
      await Facility.create({
        ...facilities,
        pool_id: newPool.id
      });
    }
    
    res.status(201).json(newPool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update existing pool - Admin only
app.put('/api/pools/:id', protect, adminOnly, validateId, async (req, res) => {
  try {
    const pool = await Pool.findByPk(req.params.id);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // Update pool data
    await pool.update(req.body);
    
    // Update facilities if provided
    if (req.body.facilities) {
      const facility = await Facility.findOne({ where: { pool_id: pool.id } });
      if (facility) {
        await facility.update(req.body.facilities);
      } else {
        await Facility.create({
          ...req.body.facilities,
          pool_id: pool.id
        });
      }
    }
    
    // Return updated pool with facilities
    const updatedPool = await Pool.findByPk(req.params.id, {
      include: [Facility]
    });
    
    res.json(updatedPool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE existing pool - Admin only
app.delete('/api/pools/:id', protect, adminOnly, validateId, async (req, res) => {
  try {
    const pool = await Pool.findByPk(req.params.id);
    
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // Delete pool (cascade should handle facilities)
    await pool.destroy();
    
    res.json({ message: 'Pool deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new review with validation - Authentication required
app.post('/api/reviews', protect, validateReview, async (req, res) => {
  try {
    const { pool_id, rating, comment, visit_date } = req.body;
    
    // Check if pool exists
    const pool = await Pool.findByPk(pool_id);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // Create review with authenticated user ID
    const review = await Review.create({
      pool_id,
      user_id: req.user.id, // Use authenticated user's ID from token
      rating,
      comment,
      visit_date
    });
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET reviews by a specific user - Users can see their own reviews
app.get('/api/users/reviews', protect, async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Pool,
        attributes: ['id', 'name']
      }]
    });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a review - Users can delete their own reviews, admins can delete any
app.delete('/api/reviews/:id', protect, validateId, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if user owns the review or is admin
    if (review.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }
    
    await review.destroy();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// NO SERVER STARTUP HERE - That happens in index.js

module.exports = app; // Export for testing and for use in index.js