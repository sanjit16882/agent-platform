module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'index.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};