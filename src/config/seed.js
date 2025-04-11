require('dotenv').config();
const bcrypt = require('bcrypt'); // Add bcrypt to your dependencies
const { Pool, Facility, User, Review } = require('../models/index');
const { sequelize } = require('../models/index');

// Sample data
const poolData = [
  {
    name: 'Laugardalslaug',
    latitude: 64.1435,
    longitude: -21.8766,
    description: 'The largest swimming pool in Iceland with outdoor pools, hot tubs, and waterslides.',
    entry_fee: 1090,
    opening_hours: '06:30-22:00 weekdays, 08:00-22:00 weekends',
    website: 'https://itr.is/laugardalslaug',
    facilities: {
      hot_tub: true,
      sauna: true,
      water_slide: true,
      child_friendly: true,
      disabled_access: true,
      gym: true
    }
  },
  {
    name: 'Sundhöllin',
    latitude: 64.1477,
    longitude: -21.9257,
    description: 'The oldest public baths in Iceland, recently renovated with new outdoor facilities.',
    entry_fee: 1090,
    opening_hours: '06:30-22:00 weekdays, 08:00-22:00 weekends',
    website: 'https://itr.is/sundhollin',
    facilities: {
      hot_tub: true,
      sauna: true,
      water_slide: false,
      child_friendly: true,
      disabled_access: true,
      gym: false
    }
  },
  {
    name: 'Blue Lagoon',
    latitude: 63.8791,
    longitude: -22.4428,
    description: 'Famous geothermal spa in a lava field in Grindavík.',
    entry_fee: 8990,
    opening_hours: '08:00-21:00 daily',
    website: 'https://www.bluelagoon.com',
    facilities: {
      hot_tub: true,
      sauna: true,
      water_slide: false,
      child_friendly: true,
      disabled_access: true,
      gym: false
    }
  }
];

const userData = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'adminPassword123',
    is_admin: true
  },
  {
    username: 'user1',
    email: 'user1@example.com',
    password: 'userPassword123',
    is_admin: false
  }
];

const reviewData = [
  {
    poolName: 'Laugardalslaug',
    username: 'user1',
    rating: 5,
    comment: 'The best pool in Reykjavik! Great hot tubs and facilities.',
    visit_date: '2023-06-15'
  },
  {
    poolName: 'Blue Lagoon',
    username: 'admin',
    rating: 4,
    comment: 'Amazing experience, but very touristy and expensive.',
    visit_date: '2023-07-22'
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Sync models (optional, use with caution in production)
    await sequelize.sync({ force: true });
    
    // Insert users
    const users = [];
    for (const user of userData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      users.push(await User.create({
        username: user.username,
        email: user.email,
        password_hash: hashedPassword,
        is_admin: user.is_admin
      }));
    }
    
    // Insert pools and facilities
    const pools = [];
    for (const pool of poolData) {
      const { facilities, ...poolInfo } = pool;
      const newPool = await Pool.create(poolInfo);
      await Facility.create({
        ...facilities,
        pool_id: newPool.id
      });
      pools.push(newPool);
    }
    
    // Insert reviews
    for (const review of reviewData) {
      const pool = pools.find(p => p.name === review.poolName);
      const user = users.find(u => u.username === review.username);
      
      if (pool && user) {
        await Review.create({
          pool_id: pool.id,
          user_id: user.id,
          rating: review.rating,
          comment: review.comment,
          visit_date: review.visit_date
        });
      }
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();