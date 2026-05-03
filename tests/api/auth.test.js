const request = require('supertest');
const app = require('../../src/app');
const testDb = require('../helpers/test-db');

beforeAll(async () => await testDb.connect());
afterAll(async () => await testDb.close());
afterEach(async () => await testDb.clear());

describe('Auth API', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).toHaveProperty('familyId');
    });

    it('should fail if email is already registered', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Other User',
          email: 'test@example.com',
          password: 'password456'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe('Email is already registered');
    });

    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
});
