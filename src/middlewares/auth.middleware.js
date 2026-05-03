const jwt = require('jsonwebtoken');

const env = require('../config/env');

function authenticate(req, _res, next) {
  if (!env.jwtSecret) {
    const error = new Error('JWT_SECRET environment variable is required');
    error.statusCode = 500;
    return next(error);
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    const error = new Error('Authentication token is required');
    error.statusCode = 401;
    return next(error);
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (_error) {
    const error = new Error('Invalid or expired authentication token');
    error.statusCode = 401;
    return next(error);
  }
}

module.exports = {
  authenticate
};
