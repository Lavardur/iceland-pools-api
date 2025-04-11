// This runs once after ALL tests across all files are complete
module.exports = async function() {
  // Get the connection stored in global setup
  const sequelize = global.__DB_CONNECTION__;
  
  if (sequelize) {
    try {
      console.log('Global teardown: Closing database connection...');
      await sequelize.close();
      console.log('Global teardown: Database connection closed');
    } catch (error) {
      console.error('Global teardown: Error closing database connection:', error);
      throw error;
    }
  }
};