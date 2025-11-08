module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'index.js',
    '!node_modules/**'
  ],
  testMatch: [
    '**/test/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};