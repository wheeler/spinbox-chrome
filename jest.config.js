export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.js', '**/*.spec.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!node_modules/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {},
};
