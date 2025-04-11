require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const Pool = require('./models/Pool');

app.use(cors());
app.use(express.json());

// Connect to PostgreSQL via Sequelize
const sequelize = require('./config/database');
sequelize.sync() // Creates tables if they don't exist
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Unable to connect to database:', err));

// Define routes
app.get('/api/pools', async (req, res) => {
  try {
    const pools = await Pool.findAll();
    res.json(pools);
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