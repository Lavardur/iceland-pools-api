const request = require('supertest');
const app = require('../../src/app');
const { Pool, Facility, Review, User, sequelize } = require('../../src/models/index');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Test data will be added here
let testPool;
let testUserPools;
let authToken;

// Create auth token for testing protected routes
const createTestToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username, isAdmin: user.is_admin },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

// More efficient setup before each test
beforeEach(async () => {
  // Direct SQL is faster for test resets
  await sequelize.query('TRUNCATE TABLE "Pools" RESTART IDENTITY CASCADE');
  await sequelize.query('TRUNCATE TABLE "Facilities" RESTART IDENTITY CASCADE');
  await sequelize.query('TRUNCATE TABLE "Users" RESTART IDENTITY CASCADE');
  await sequelize.query('TRUNCATE TABLE "Reviews" RESTART IDENTITY CASCADE');
  
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  testUserPools = await User.create({
    username: 'testpoolsuser',
    email: 'testpools@example.com',
    password_hash: hashedPassword,
    is_admin: true
  });
  
  // Create auth token
  authToken = createTestToken(testUserPools);
  
  // Create test pool
  testPool = await Pool.create({
    name: 'Integration Test Pool',
    latitude: 64.1234,
    longitude: -21.1234,
    entry_fee: 1000,
    description: 'Test pool description',
    opening_hours: '10:00-20:00',
    website: 'https://testpool.is'
  });
  
  // Create facility for the pool
  await Facility.create({
    pool_id: testPool.id,
    hot_tub: true,
    sauna: true,
    water_slide: false,
    child_friendly: true
  });
});

describe('Pool API Integration', () => {
  // GET all pools
  test('GET /api/pools should return all pools', async () => {
    const response = await request(app).get('/api/pools');
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Integration Test Pool');
    expect(response.body[0].Facility).toBeTruthy();
    expect(response.body[0].Facility.hot_tub).toBe(true);
  });

  // GET specific pool by ID
  test('GET /api/pools/:id should return a specific pool', async () => {
    const response = await request(app).get(`/api/pools/${testPool.id}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Integration Test Pool');
    expect(response.body.entry_fee).toBe(1000);
  });

  // GET non-existent pool
  test('GET /api/pools/:id with invalid ID should return 404', async () => {
    const response = await request(app).get('/api/pools/999');
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
  
  // POST new pool
  test('POST /api/pools should create a new pool', async () => {
    const newPool = {
      name: 'Brand New Pool',
      latitude: 65.6835,
      longitude: -18.1002,
      entry_fee: 1200,
      description: 'A lovely new pool in Akureyri',
      facilities: {
        hot_tub: true,
        sauna: false,
        water_slide: true,
        child_friendly: true
      }
    };
    
    const response = await request(app)
      .post('/api/pools')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newPool);
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Brand New Pool');
    
    // Verify pool was added to database
    const storedPool = await Pool.findByPk(response.body.id, {
      include: [Facility]
    });
    
    expect(storedPool).toBeTruthy();
    expect(storedPool.name).toBe('Brand New Pool');
    expect(storedPool.Facility.hot_tub).toBe(true);
    expect(storedPool.Facility.water_slide).toBe(true);
  });
  
  // POST validation errors
  test('POST /api/pools with invalid data should return 400', async () => {
    const invalidPool = {
      // Missing required name field
      latitude: 65.6835,
      longitude: -18.1002
    };
    
    const response = await request(app)
      .post('/api/pools')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidPool);
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });
  
  // PUT update pool
  test('PUT /api/pools/:id should update a pool', async () => {
    const updateData = {
      name: 'Updated Pool Name',
      entry_fee: 1500
    };
    
    const response = await request(app)
      .put(`/api/pools/${testPool.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Updated Pool Name');
    expect(response.body.entry_fee).toBe(1500);
    
    // Verify changes in database
    const updatedPool = await Pool.findByPk(testPool.id);
    expect(updatedPool.name).toBe('Updated Pool Name');
    expect(updatedPool.entry_fee).toBe(1500);
  });
  
  // DELETE pool
  test('DELETE /api/pools/:id should delete a pool', async () => {
    const response = await request(app)
      .delete(`/api/pools/${testPool.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message');
    
    // Verify pool was deleted
    const deletedPool = await Pool.findByPk(testPool.id);
    expect(deletedPool).toBeNull();
  });
  
  // POST new review
  test('POST /api/reviews should create a review', async () => {
    const review = {
      pool_id: testPool.id,
      rating: 5,
      comment: 'Fantastic pool with great facilities!',
      visit_date: '2023-06-15'
    };
    
    const response = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send(review);
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.rating).toBe(5);
    expect(response.body.comment).toBe('Fantastic pool with great facilities!');
    
    // Verify review was added
    const storedReview = await Review.findByPk(response.body.id);
    expect(storedReview).toBeTruthy();
    expect(storedReview.pool_id).toBe(testPool.id);
  });
  
  // GET reviews for pool
  test('GET /api/pools/:id/reviews should return pool reviews', async () => {
    // Add a review first
    await Review.create({
      pool_id: testPool.id,
      user_id: testUser.id,
      rating: 4,
      comment: 'Good facilities but a bit crowded',
      visit_date: '2023-05-20'
    });
    
    const response = await request(app).get(`/api/pools/${testPool.id}/reviews`);
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].rating).toBe(4);
    expect(response.body[0].User.username).toBe('testuser');
  });
  
  // Health check endpoint
  test('GET /api/health should return status UP', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('timestamp');
  });
});