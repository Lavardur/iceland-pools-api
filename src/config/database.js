const { Sequelize } = require('sequelize');

// Force the environment to be explicitly set before importing dotenv
// This ensures that NODE_ENV is recognized throughout the application
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Load the appropriate .env file based on NODE_ENV
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});

console.log(`Using database: ${process.env.DATABASE_URL} (${process.env.NODE_ENV} environment)`);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'test' ? false : console.log,
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

module.exports = sequelize;