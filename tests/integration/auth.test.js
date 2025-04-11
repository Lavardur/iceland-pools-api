const request = require('supertest');
const app = require('../../src/app');
const { User, sequelize } = require('../../src/models/index');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Test data
let testUserAuth;
let authToken;

// Create auth token for testing
const createTestToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username, isAdmin: user.is_admin },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

// Setup before each test
beforeEach(async () => {
  // Reset tables
  await sequelize.query('TRUNCATE TABLE "Users" RESTART IDENTITY CASCADE');
  
  // Create test user
  const hashedPassword = await bcrypt.hash('Password123', 10);
  testUserAuth = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password_hash: hashedPassword,
    is_admin: true
  });
  
  authToken = createTestToken(testUserAuth);
});

describe('Auth API Integration Tests', () => {
  test('POST /api/auth/login with valid credentials should return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('username', 'testuser');
  });
  
  test('POST /api/auth/login with invalid credentials should return 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    expect(response.statusCode).toBe(401);
  });
  
  test('POST /api/auth/register should create a new user', async () => {
    const newUser = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123'
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);
    
    // Log error response for debugging
    if (response.statusCode !== 201) {
      console.error('Registration failed:', response.body);
    }
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body.user).toHaveProperty('username', 'newuser');
    
    // Verify user was created
    const storedUser = await User.findOne({ where: { email: 'new@example.com' } });
    expect(storedUser).toBeTruthy();
    expect(storedUser.username).toBe('newuser');
  });
});