// Disable MD5 checksum validation to prevent intermittent download failures across CI and Windows environments.
process.env.MONGOMS_MD5_CHECK = '0';
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '8.2.6';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-ci-fallback';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});