const { authenticate } = require('../../src/middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const env = require('../../src/config/env');

jest.mock('jsonwebtoken');
jest.mock('../../src/config/env', () => ({
  jwtSecret: 'test-secret'
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 when authorization header is missing', () => {
    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Authentication token is required',
      statusCode: 401
    }));
  });

  it('should attach decoded user when token is valid', () => {
    req.headers.authorization = 'Bearer valid-token';
    const decodedUser = { id: 'u1', familyId: 'fam-1' };
    jwt.verify.mockReturnValue(decodedUser);

    authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toEqual(decodedUser);
    expect(next).toHaveBeenCalledWith();
  });

  it('should return 401 when token is invalid', () => {
    req.headers.authorization = 'Bearer invalid-token';
    jwt.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid or expired authentication token',
      statusCode: 401
    }));
  });
});
