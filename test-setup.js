// Prevent real file operations in tests
process.env.NODE_ENV = 'test';
process.env.HOME = '/test-home';