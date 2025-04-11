const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

// Mock JWT for auth tests
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ userId: 1, username: 'testadmin', isAdmin: true }),
  sign: jest.fn().mockReturnValue('fake-test-token')
}));

// Mock the models and responses
jest.mock('../../src/models/index', () => {
  // Mock data
  const testPool = { 
    id: 1, 
    name: 'Test Pool', 
    latitude: 64.1234, 
    longitude: -21.1234,
    entry_fee: 1000,
    Facility: { hot_tub: true, sauna: false },
    Reviews: [
      { 
        id: 1, 
        rating: 5, 
        comment: 'Great pool!', 
        visit_date: '2023-06-15',
        User: { username: 'testuser' }
      }
    ]
  };
  
  const testUser = {
    id: 1,
    username: 'testadmin',
    email: 'test@example.com',
    is_admin: true
  };
  
  // Mock Pool model
  const mockPool = {
    findAll: jest.fn().mockResolvedValue([testPool]),
    findByPk: jest.fn().mockImplementation((id) => {
      if (id == 1) return Promise.resolve(testPool);
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((data) => {
      return Promise.resolve({ id: 2, ...data });
    })
  };
  
  // Mock User model
  const mockUser = {
    findByPk: jest.fn().mockResolvedValue(testUser),
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.email === 'test@example.com') {
        return Promise.resolve(testUser);
      }
      return Promise.resolve(null);
    })
  };
  
  // Mock Review model
  const mockReview = {
    findAll: jest.fn().mockResolvedValue([
      { 
        id: 1, 
        rating: 5, 
        comment: 'Great pool!', 
        visit_date: '2023-06-15',
        User: { username: 'testuser' }
      }
    ]),
    create: jest.fn().mockImplementation((data) => {
      return Promise.resolve({ id: 2, ...data });
    }),
    findByPk: jest.fn().mockImplementation((id) => {
      if (id == 1) {
        return Promise.resolve({ 
          id: 1,
          user_id: 1,
          pool_id: 1,
          rating: 5, 
          comment: 'Great pool!',
          destroy: jest.fn().mockResolvedValue(true)
        });
      }
      return Promise.resolve(null);
    })
  };
  
  // Mock Facility model
  const mockFacility = {
    create: jest.fn().mockImplementation((data) => {
      return Promise.resolve({ id: 1, ...data });
    }),
    findOne: jest.fn().mockResolvedValue({
      id: 1,
      pool_id: 1,
      hot_tub: true,
      sauna: false,
      update: jest.fn().mockResolvedValue(true)
    })
  };
  
  // Add destroy method to mock pool
  mockPool.findByPk.mockImplementation((id) => {
    if (id == 1) {
      return Promise.resolve({
        id: 1,
        name: 'Test Pool',
        latitude: 64.1234,
        longitude: -21.1234,
        entry_fee: 1000,
        update: jest.fn().mockImplementation((data) => {
          return Promise.resolve({ id: 1, ...data });
        }),
        destroy: jest.fn().mockResolvedValue(true)
      });
    }
    return Promise.resolve(null);
  });

  // Mock Sequelize Op
  const Sequelize = {
    Op: {
      or: Symbol('or')
    }
  };

  return {
    Pool: mockPool,
    Facility: mockFacility,
    User: mockUser,
    Review: mockReview,
    Sequelize,
    sequelize: {
      sync: jest.fn().mockResolvedValue(),
      query: jest.fn().mockResolvedValue()
    }
  };
});

describe('Pool API', () => {
  // Common test JWT token
  const testToken = 'Bearer fake-auth-token';
  
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

  // Test GET /api/pools/:id
  test('GET /api/pools/:id should return specific pool', async () => {
    const response = await request(app).get('/api/pools/1');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('name', 'Test Pool');
    expect(response.body).toHaveProperty('longitude', -21.1234);
  });

  // Test GET /api/pools/:id with invalid ID
  test('GET /api/pools/:id with non-existent ID should return 404', async () => {
    const response = await request(app).get('/api/pools/999');
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error', 'Pool not found');
  });

  // Test GET /api/pools/:id/reviews
  test('GET /api/pools/:id/reviews should return reviews for a specific pool', async () => {
    const response = await request(app).get('/api/pools/1/reviews');
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('rating', 5);
    expect(response.body[0]).toHaveProperty('User');
    expect(response.body[0].User).toHaveProperty('username', 'testuser');
  });

  // Test POST /api/pools with authentication
  test('POST /api/pools should create a new pool when admin authenticated', async () => {
    const newPool = {
      name: 'New Test Pool',
      latitude: 65.6835,
      longitude: -18.1002,
      entry_fee: 1200,
      facilities: {
        hot_tub: true,
        sauna: false
      }
    };
    
    const response = await request(app)
      .post('/api/pools')
      .set('Authorization', testToken)
      .send(newPool);
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'New Test Pool');
    expect(response.body).toHaveProperty('latitude', 65.6835);
  });

  // Test POST /api/pools without authentication
  test('POST /api/pools without token should return 401', async () => {
    const newPool = {
      name: 'New Test Pool',
      latitude: 65.6835,
      longitude: -18.1002
    };
    
    const response = await request(app)
      .post('/api/pools')
      .send(newPool);
    
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  // Test PUT /api/pools/:id with authentication
  test('PUT /api/pools/:id should update pool when admin authenticated', async () => {
    const updateData = {
      name: 'Updated Pool Name',
      entry_fee: 1500
    };
    
    const response = await request(app)
      .put('/api/pools/1')
      .set('Authorization', testToken)
      .send(updateData);
    
    expect(response.statusCode).toBe(200);
  });

  // Test PUT /api/pools/:id with non-existent ID
  test('PUT /api/pools/:id with non-existent ID should return 404', async () => {
    const updateData = {
      name: 'Updated Pool Name'
    };
    
    const response = await request(app)
      .put('/api/pools/999')
      .set('Authorization', testToken)
      .send(updateData);
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error', 'Pool not found');
  });

  // Test DELETE /api/pools/:id with authentication
  test('DELETE /api/pools/:id should delete pool when admin authenticated', async () => {
    const response = await request(app)
      .delete('/api/pools/1')
      .set('Authorization', testToken);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Pool deleted successfully');
  });

  // Test DELETE /api/pools/:id with non-existent ID
  test('DELETE /api/pools/:id with non-existent ID should return 404', async () => {
    const response = await request(app)
      .delete('/api/pools/999')
      .set('Authorization', testToken);
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error', 'Pool not found');
  });

  // Test POST /api/reviews with authentication
  test('POST /api/reviews should create a new review when authenticated', async () => {
    const newReview = {
      pool_id: 1,
      rating: 4,
      comment: 'Good facilities but a bit crowded',
      visit_date: '2023-05-20'
    };
    
    const response = await request(app)
      .post('/api/reviews')
      .set('Authorization', testToken)
      .send(newReview);
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('rating', 4);
    expect(response.body).toHaveProperty('comment', 'Good facilities but a bit crowded');
  });

  // Test GET /api/users/reviews with authentication
  test('GET /api/users/reviews should return user reviews when authenticated', async () => {
    const response = await request(app)
      .get('/api/users/reviews')
      .set('Authorization', testToken);
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // Test DELETE /api/reviews/:id with authentication
  test('DELETE /api/reviews/:id should delete review when authenticated', async () => {
    const response = await request(app)
      .delete('/api/reviews/1')
      .set('Authorization', testToken);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Review deleted successfully');
  });

  // Test DELETE /api/reviews/:id with non-existent ID
  test('DELETE /api/reviews/:id with non-existent ID should return 404', async () => {
    const response = await request(app)
      .delete('/api/reviews/999')
      .set('Authorization', testToken);
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error', 'Review not found');
  });

  // Test GET /api/health
  test('GET /api/health should return status UP', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('timestamp');
  });
});