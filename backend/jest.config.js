// jest.config.js
export default {
  testEnvironment: 'node',
  // Run this file before all tests to set up the DB and Mocks
  setupFilesAfterEnv: ['./tests/setup.js'],
  // Clear mock calls and instances between every test
  clearMocks: true, 
};