const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { connectDatabase } = require('../config/database');
const env = require('../config/env');
const User = require('../models/user.model');
const { resolveFamilyIdForRegistration } = require('../utils/familyId.util');

function buildAuthResponse(user) {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      familyId: user.familyId
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      familyId: user.familyId
    }
  };
}

async function registerUser(payload) {
  await connectDatabase();

  if (!env.jwtSecret) {
    const error = new Error('JWT_SECRET environment variable is required');
    error.statusCode = 500;
    throw error;
  }

  const { name, email, password } = payload;

  if (!name || !email || !password) {
    const error = new Error('name, email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const familyId = resolveFamilyIdForRegistration(payload.familyId);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: passwordHash,
    familyId
  });

  return buildAuthResponse(user);
}

async function loginUser(payload) {
  await connectDatabase();

  if (!env.jwtSecret) {
    const error = new Error('JWT_SECRET environment variable is required');
    error.statusCode = 500;
    throw error;
  }

  const { email, password } = payload;

  if (!email || !password) {
    const error = new Error('email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  return buildAuthResponse(user);
}

module.exports = {
  registerUser,
  loginUser
};
