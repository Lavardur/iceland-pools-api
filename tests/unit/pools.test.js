const request = require('supertest');
const app = require('../../src/app');
const { Pool, sequelize } = require('../../src/models/index');

// Mock the Pool.findAll method
jest.mock('../../src/models/index', () => {
  const mockPool = {
    findAll: jest.fn().mockResolvedValue([
      { 
        id: 1, 
        name: 'Test Pool', 
        latitude: 64.1234, 
        longitude: -21.1234,
        entry_fee: 1000,
        Facility: { hot_tub: true, sauna: false }
      }
    ]),
    findByPk: jest.fn().mockResolvedValue({
      id: 1, 
      name: 'Test Pool', 
      latitude: 64.1234, 
      longitude: -21.1234
    })
  };

  return {
    Pool: mockPool,
    Facility: {},
    User: {},
    Review: {},
    sequelize: {
      sync: jest.fn().mockResolvedValue()
    }
  };
});

describe('Pool API', () => {
  // Test GET /api/pools
  test('GET /api/pools should return all pools', async () => {
    const response = await request(app).get('/api/pools');
    
    // Verify response
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('name', 'Test Pool');
    expect(response.body[0]).toHaveProperty('Facility');
  });

  // Test GET /api/health
  test('GET /api/health should return status UP', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('timestamp');
  });
});