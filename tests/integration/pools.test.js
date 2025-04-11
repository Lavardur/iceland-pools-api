const request = require('supertest');
const app = require('../../src/app');
const { Pool, sequelize } = require('../../src/models/index');

// Test data will be added here
let testPool;

// More efficient setup before each test
beforeEach(async () => {
  // Direct SQL is faster for test resets
  await sequelize.query('TRUNCATE TABLE "Pools" RESTART IDENTITY CASCADE');
  
  // Create test data
  testPool = await Pool.create({
    name: 'Integration Test Pool',
    latitude: 64.1234,
    longitude: -21.1234,
    entry_fee: 1000
  });
});

describe('Pool API Integration', () => {
  test('GET /api/pools should return all pools', async () => {
    const response = await request(app).get('/api/pools');
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Integration Test Pool');
  });

  test('GET /api/pools/:id should return a specific pool', async () => {
    const response = await request(app).get(`/api/pools/${testPool.id}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Integration Test Pool');
  });

  // Add a test for non-existent ID
  test('GET /api/pools/:id with invalid ID should return 404', async () => {
    const response = await request(app).get('/api/pools/999');
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});