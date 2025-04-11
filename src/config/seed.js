require('dotenv').config();
const Pool = require('../models/Pool');
const sequelize = require('./database');

const poolData = [
  {
    name: 'Laugardalslaug',
    latitude: 64.1435,
    longitude: -21.8766,
    entry_fee: 1090
  },
  {
    name: 'Sundhöllin',
    latitude: 64.1477,
    longitude: -21.9257,
    entry_fee: 1090
  },
  {
    name: 'Vesturbæjarlaug',
    latitude: 64.1418,
    longitude: -21.9550,
    entry_fee: 1090
  },
  {
    name: 'Árbæjarlaug',
    latitude: 64.1171,
    longitude: -21.8026,
    entry_fee: 1090
  },
  {
    name: 'Blue Lagoon',
    latitude: 63.8791,
    longitude: -22.4428,
    entry_fee: 8990
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Sync models (optional, use with caution in production)
    // await sequelize.sync({ force: true });
    
    // Insert pool data
    for (const pool of poolData) {
      await Pool.create(pool);
      console.log(`Added pool: ${pool.name}`);
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();