// This runs once before ALL tests across all files
const { sequelize } = require('../src/models/index');

module.exports = async function() {
  // Set environment variable
  process.env.NODE_ENV = 'test';
  
  // Store the connection in the global object so it can be accessed in teardown
  global.__DB_CONNECTION__ = sequelize;
  
  try {
    console.log('Global setup: Connecting to test database...');
    await sequelize.authenticate();
    console.log('Global setup: Test database connected successfully');
    
    // Drop and recreate all tables
    await sequelize.sync({ force: true });
    console.log('Global setup: Test database tables recreated');
  } catch (error) {
    console.error('Global setup: Error setting up test database:', error);
    throw error; // Fail the tests if database setup fails
  }
};