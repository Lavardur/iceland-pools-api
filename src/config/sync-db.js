const sequelize = require('./database');
const Pool = require('../models/Pool');

sequelize.sync({ force: true }) // ⚠️ Use `force: true` only in development (it drops existing tables!)
  .then(() => console.log('Database synced!'))
  .catch(err => console.error('Error syncing database:', err));