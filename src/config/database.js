const mongoose = require('mongoose');

const env = require('./env');

async function connectDatabase() {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongodbUri);
}

module.exports = {
  connectDatabase
};
