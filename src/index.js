require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// Import models and middleware
const { Pool, Facility, User, Review, sequelize } = require('./models/index');
const { baseLimit, authLimit } = require('./middleware/rateLimit');
const { validatePool, validateReview, validateId } = require('./middleware/validators');
const authRoutes = require('./routes/auth');

app.use(cors());
app.use(express.json());

// Apply rate limiting to all requests
app.use(baseLimit);

// Connect to PostgreSQL via Sequelize
sequelize.sync() // Creates tables if they don't exist
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Unable to connect to database:', err));

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

// POST new pool with validation
app.post('/api/pools', validatePool, async (req, res) => {
  try {
    // Authentication check would go here
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

// POST new review with validation
app.post('/api/reviews', validateReview, async (req, res) => {
  try {
    // Authentication check would go here
    const { pool_id, rating, comment, visit_date } = req.body;
    
    // Check if pool exists
    const pool = await Pool.findByPk(pool_id);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }
    
    // In a real app, you'd get the user_id from auth token
    // For now, let's assume user_id = 1 (admin)
    const review = await Review.create({
      pool_id,
      user_id: 1, // Replace with authenticated user ID
      rating,
      comment,
      visit_date
    });
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Use environment variable for port with fallback
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));