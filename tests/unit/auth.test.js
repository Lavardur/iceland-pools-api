const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models/index');
const bcrypt = require('bcrypt');

// Mock User model
jest.mock('../../src/models/index', () => {
  const bcrypt = require('bcrypt');
  
  const mockUser = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.email === 'test@example.com') {
        return Promise.resolve({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password_hash: bcrypt.hashSync('Password123', 10),
          is_admin: false
        });
      }
      return Promise.resolve(null);
    })
  };

  return {
    User: mockUser,
    Pool: {},
    Facility: {},
    Review: {},
    sequelize: {
      sync: jest.fn().mockResolvedValue()
    }
  };
});

describe('Auth API', () => {
  test('POST /api/auth/login with valid credentials should return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username', 'testuser');
  });

  test('POST /api/auth/login with invalid credentials should return 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword'
      });
    
    expect(response.statusCode).toBe(401);
  });
});