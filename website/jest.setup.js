// Jest setup file for global test configuration

// Set test environment variables
process.env.JWT_SECRET = 'dev-secret-key-change-in-production';
process.env.NODE_ENV = 'test';
process.env.__NEXT_TEST_MODE = 'jest';
