const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const servicePath = path.resolve(__dirname, '../../src/services/auth.service.js');
const databasePath = path.resolve(__dirname, '../../src/config/database.js');
const envPath = path.resolve(__dirname, '../../src/config/env.js');
const userPath = path.resolve(__dirname, '../../src/models/user.model.js');
const bcryptPath = require.resolve('bcryptjs');
const jwtPath = require.resolve('jsonwebtoken');

function withMockedModules(mocks, loadModule) {
  const savedCache = new Map();

  for (const [modulePath, moduleExports] of Object.entries(mocks)) {
    savedCache.set(modulePath, require.cache[modulePath]);
    require.cache[modulePath] = {
      id: modulePath,
      filename: modulePath,
      loaded: true,
      exports: moduleExports
    };
  }

  delete require.cache[servicePath];

  try {
    return loadModule();
  } finally {
    delete require.cache[servicePath];
    for (const [modulePath, previousEntry] of savedCache.entries()) {
      if (previousEntry) {
        require.cache[modulePath] = previousEntry;
      } else {
        delete require.cache[modulePath];
      }
    }
  }
}

test('registerUser creates user with hashed password and returns token payload', async () => {
  let capturedCreatedPayload;
  let capturedJwtPayload;
  let capturedJwtSecret;
  let capturedJwtOptions;
  let connectCalls = 0;

  const authService = withMockedModules(
    {
      [databasePath]: {
        connectDatabase: async () => {
          connectCalls += 1;
        }
      },
      [envPath]: { jwtSecret: 'test-secret', jwtExpiresIn: '2h' },
      [userPath]: {
        findOne: async () => null,
        create: async (payload) => {
          capturedCreatedPayload = payload;
          return {
            id: 'u1',
            name: payload.name,
            email: payload.email,
            familyId: payload.familyId
          };
        }
      },
      [bcryptPath]: {
        hash: async (password, rounds) => {
          assert.equal(password, 'raw-password');
          assert.equal(rounds, 10);
          return 'hashed-password';
        }
      },
      [jwtPath]: {
        sign: (payload, secret, options) => {
          capturedJwtPayload = payload;
          capturedJwtSecret = secret;
          capturedJwtOptions = options;
          return 'signed-jwt';
        }
      }
    },
    () => require(servicePath)
  );

  const result = await authService.registerUser({
    name: 'Milena',
    email: 'milena@example.com',
    password: 'raw-password',
    familyId: 'fam-1'
  });

  assert.deepEqual(capturedCreatedPayload, {
    name: 'Milena',
    email: 'milena@example.com',
    password: 'hashed-password',
    familyId: 'fam-1'
  });
  assert.deepEqual(capturedJwtPayload, {
    id: 'u1',
    email: 'milena@example.com',
    familyId: 'fam-1'
  });
  assert.equal(capturedJwtSecret, 'test-secret');
  assert.deepEqual(capturedJwtOptions, { expiresIn: '2h' });
  assert.deepEqual(result, {
    token: 'signed-jwt',
    user: {
      id: 'u1',
      name: 'Milena',
      email: 'milena@example.com',
      familyId: 'fam-1'
    }
  });
  assert.equal(connectCalls, 1);
});

test('registerUser fails when email already exists', async () => {
  let connectCalls = 0;

  const authService = withMockedModules(
    {
      [databasePath]: {
        connectDatabase: async () => {
          connectCalls += 1;
        }
      },
      [envPath]: { jwtSecret: 'test-secret', jwtExpiresIn: '1d' },
      [userPath]: {
        findOne: async () => ({ id: 'existing' })
      },
      [bcryptPath]: { hash: async () => 'ignored' },
      [jwtPath]: { sign: () => 'ignored' }
    },
    () => require(servicePath)
  );

  await assert.rejects(
    () => authService.registerUser({
      name: 'User',
      email: 'already@used.com',
      password: '123',
      familyId: 'fam-1'
    }),
    (error) => {
      assert.equal(error.message, 'Email is already registered');
      assert.equal(error.statusCode, 409);
      return true;
    }
  );
  assert.equal(connectCalls, 1);
});

test('loginUser returns jwt when credentials are valid', async () => {
  let connectCalls = 0;

  const authService = withMockedModules(
    {
      [databasePath]: {
        connectDatabase: async () => {
          connectCalls += 1;
        }
      },
      [envPath]: { jwtSecret: 'test-secret', jwtExpiresIn: '1d' },
      [userPath]: {
        findOne: async ({ email }) => ({
          id: 'u2',
          name: 'Joao',
          email,
          familyId: 'fam-2',
          password: 'stored-hash'
        })
      },
      [bcryptPath]: {
        compare: async (provided, stored) => {
          assert.equal(provided, 'right-password');
          assert.equal(stored, 'stored-hash');
          return true;
        }
      },
      [jwtPath]: {
        sign: () => 'valid-jwt'
      }
    },
    () => require(servicePath)
  );

  const result = await authService.loginUser({
    email: 'joao@example.com',
    password: 'right-password'
  });

  assert.equal(result.token, 'valid-jwt');
  assert.deepEqual(result.user, {
    id: 'u2',
    name: 'Joao',
    email: 'joao@example.com',
    familyId: 'fam-2'
  });
  assert.equal(connectCalls, 1);
});

test('loginUser rejects invalid credentials', async () => {
  let connectCalls = 0;

  const authService = withMockedModules(
    {
      [databasePath]: {
        connectDatabase: async () => {
          connectCalls += 1;
        }
      },
      [envPath]: { jwtSecret: 'test-secret', jwtExpiresIn: '1d' },
      [userPath]: {
        findOne: async () => null
      },
      [bcryptPath]: { compare: async () => false },
      [jwtPath]: { sign: () => 'ignored' }
    },
    () => require(servicePath)
  );

  await assert.rejects(
    () => authService.loginUser({ email: 'none@example.com', password: 'x' }),
    (error) => {
      assert.equal(error.message, 'Invalid credentials');
      assert.equal(error.statusCode, 401);
      return true;
    }
  );
  assert.equal(connectCalls, 1);
});
