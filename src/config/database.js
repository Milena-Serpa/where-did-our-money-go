const mongoose = require('mongoose');

const env = require('./env');

let connectionPromise = null;

async function connectDatabase() {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  mongoose.set('strictQuery', true);

  connectionPromise = mongoose
    .connect(env.mongodbUri)
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
}

module.exports = {
  connectDatabase
};
