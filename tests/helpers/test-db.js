const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const env = require('../../src/config/env');

let mongoServer;

async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Override env.mongodbUri for tests
  env.mongodbUri = uri;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
}

async function close() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

async function clear() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
}

module.exports = {
  connect,
  close,
  clear
};
