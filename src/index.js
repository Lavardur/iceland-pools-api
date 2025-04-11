require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// Import models
const { Pool, Facility, User, Review, sequelize } = require('./models/index');

app.use(cors());
app.use(express.json());

// Connect to PostgreSQL via Sequelize
sequelize.sync() // Creates tables if they don't exist
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Unable to connect to database:', err));

// Define routes
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

app.get('/api/pools/:id', async (req, res) => {
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

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Use environment variable for port with fallback
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));