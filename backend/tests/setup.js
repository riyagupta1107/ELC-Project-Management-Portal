// tests/setup.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';

let mongoServer;

// 1. Global Firebase Admin Mock
jest.unstable_mockModule('../src/config/firebase-admin.js', () => ({
  default: {
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn(),
    }),
  },
}));

// 2. Database Setup
beforeAll(async () => {
  // Spin up the in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect Mongoose to the in-memory DB
  await mongoose.connect(uri);
});

afterEach(async () => {
  // After every single test, wipe the database clean
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

afterAll(async () => {
  // When all tests are done, disconnect and stop the server
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});