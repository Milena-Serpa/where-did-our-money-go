const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const middlewarePath = path.resolve(__dirname, '../../src/middlewares/auth.middleware.js');
const envPath = path.resolve(__dirname, '../../src/config/env.js');
const jwtPath = require.resolve('jsonwebtoken');

function loadAuthenticateWithMocks({ envMock, jwtMock }) {
  const savedEnv = require.cache[envPath];
  const savedJwt = require.cache[jwtPath];

  require.cache[envPath] = {
    id: envPath,
    filename: envPath,
    loaded: true,
    exports: envMock
  };
  require.cache[jwtPath] = {
    id: jwtPath,
    filename: jwtPath,
    loaded: true,
    exports: jwtMock
  };

  delete require.cache[middlewarePath];

  try {
    return require(middlewarePath).authenticate;
  } finally {
    delete require.cache[middlewarePath];
    if (savedEnv) {
      require.cache[envPath] = savedEnv;
    } else {
      delete require.cache[envPath];
    }
    if (savedJwt) {
      require.cache[jwtPath] = savedJwt;
    } else {
      delete require.cache[jwtPath];
    }
  }
}

test('authenticate returns 401 when authorization header is missing', () => {
  const authenticate = loadAuthenticateWithMocks({
    envMock: { jwtSecret: 'test-secret' },
    jwtMock: { verify: () => ({ id: 'u1' }) }
  });

  const req = { headers: {} };
  let capturedError;

  authenticate(req, null, (error) => {
    capturedError = error;
  });

  assert.equal(capturedError.message, 'Authentication token is required');
  assert.equal(capturedError.statusCode, 401);
});

test('authenticate attaches decoded user when token is valid', () => {
  const authenticate = loadAuthenticateWithMocks({
    envMock: { jwtSecret: 'test-secret' },
    jwtMock: {
      verify: (token, secret) => {
        assert.equal(token, 'valid-token');
        assert.equal(secret, 'test-secret');
        return { id: 'u1', familyId: 'fam-1' };
      }
    }
  });

  const req = { headers: { authorization: 'Bearer valid-token' } };
  let nextCalledWithoutError = false;

  authenticate(req, null, (error) => {
    nextCalledWithoutError = !error;
  });

  assert.equal(nextCalledWithoutError, true);
  assert.deepEqual(req.user, { id: 'u1', familyId: 'fam-1' });
});

test('authenticate returns 401 when token is invalid', () => {
  const authenticate = loadAuthenticateWithMocks({
    envMock: { jwtSecret: 'test-secret' },
    jwtMock: {
      verify: () => {
        throw new Error('bad token');
      }
    }
  });

  const req = { headers: { authorization: 'Bearer invalid-token' } };
  let capturedError;

  authenticate(req, null, (error) => {
    capturedError = error;
  });

  assert.equal(capturedError.message, 'Invalid or expired authentication token');
  assert.equal(capturedError.statusCode, 401);
});
