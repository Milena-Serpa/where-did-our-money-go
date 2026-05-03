const authService = require('../../src/services/auth.service');
const User = require('../../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../../src/config/database');
const env = require('../../src/config/env');

jest.mock('../../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/database');
jest.mock('../../src/config/env', () => ({
  jwtSecret: 'test-secret',
  jwtExpiresIn: '1d'
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should create user with hashed password and return token payload', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 'u1',
        name: 'Milena',
        email: 'milena@example.com',
        familyId: 'fam-1'
      });
      bcrypt.hash.mockResolvedValue('hashed-password');
      jwt.sign.mockReturnValue('signed-jwt');

      const result = await authService.registerUser({
        name: 'Milena',
        email: 'milena@example.com',
        password: 'raw-password',
        familyId: 'fam-1'
      });

      expect(connectDatabase).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('raw-password', 10);
      expect(User.create).toHaveBeenCalledWith({
        name: 'Milena',
        email: 'milena@example.com',
        password: 'hashed-password',
        familyId: 'fam-1'
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'u1', email: 'milena@example.com', familyId: 'fam-1' },
        'test-secret',
        { expiresIn: '1d' }
      );
      expect(result).toEqual({
        token: 'signed-jwt',
        user: {
          id: 'u1',
          name: 'Milena',
          email: 'milena@example.com',
          familyId: 'fam-1'
        }
      });
    });

    it('should fail when email already exists', async () => {
      User.findOne.mockResolvedValue({ id: 'existing' });

      await expect(authService.registerUser({
        name: 'User',
        email: 'already@used.com',
        password: '123',
        familyId: 'fam-1'
      })).rejects.toMatchObject({
        message: 'Email is already registered',
        statusCode: 409
      });
    });

    it('should assign generated familyId when familyId is omitted', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockImplementation((payload) => Promise.resolve({
        id: 'u-new',
        ...payload
      }));
      bcrypt.hash.mockResolvedValue('hashed');
      jwt.sign.mockReturnValue('token');

      const result = await authService.registerUser({
        name: 'Solo',
        email: 'solo@example.com',
        password: 'secret'
      });

      expect(result.user.familyId).toMatch(/^fam-[a-f0-9]{24}$/);
    });

    it('should normalize provided familyId', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockImplementation((payload) => Promise.resolve({
        id: 'u-join',
        ...payload
      }));
      bcrypt.hash.mockResolvedValue('hashed');
      jwt.sign.mockReturnValue('token');

      await authService.registerUser({
        name: 'Member',
        email: 'member@example.com',
        password: 'secret',
        familyId: '  Shared-Kitchen  '
      });

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        familyId: 'shared-kitchen'
      }));
    });

    it('should reject invalid familyId slug', async () => {
      await expect(authService.registerUser({
        name: 'Bad',
        email: 'bad@example.com',
        password: 'secret',
        familyId: 'no'
      })).rejects.toMatchObject({
        statusCode: 400
      });
    });
  });

  describe('loginUser', () => {
    it('should return jwt when credentials are valid', async () => {
      User.findOne.mockResolvedValue({
        id: 'u2',
        name: 'Joao',
        email: 'joao@example.com',
        familyId: 'fam-2',
        password: 'stored-hash'
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('valid-jwt');

      const result = await authService.loginUser({
        email: 'joao@example.com',
        password: 'right-password'
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('right-password', 'stored-hash');
      expect(result.token).toBe('valid-jwt');
      expect(result.user.email).toBe('joao@example.com');
    });

    it('should reject invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.loginUser({
        email: 'none@example.com',
        password: 'x'
      })).rejects.toMatchObject({
        message: 'Invalid credentials',
        statusCode: 401
      });
    });
  });
});
