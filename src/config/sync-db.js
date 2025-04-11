const { sequelize } = require('../models/index');

// Import models
require('../models/index');

sequelize.sync({ force: true }) // ⚠️ Use `force: true` only in development (it drops existing tables!)
  .then(() => console.log('Database synced!'))
  .catch(err => console.error('Error syncing database:', err));