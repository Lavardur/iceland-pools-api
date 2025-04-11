const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Connect to PostgreSQL via Sequelize
const sequelize = require('./config/database');
sequelize.sync(); // Creates tables if they don't exist

// Define routes
app.get('/api/pools', async (req, res) => {
  const pools = await Pool.findAll();
  res.json(pools);
});

app.listen(3000, () => console.log('API running on port 3000'));