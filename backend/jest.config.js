export default {
  testEnvironment: 'node',
  transform: { '^.+\\.js$': 'babel-jest' },
  testMatch: ['**/tests/structural/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    // 'controllers/**/*.js',
    'middleware/**/*.js',
    // 'models/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!middleware/rateLimiter.js', // Exclude rate limiter for now due to external dependencies
    '!utils/generateToken.js', // Exclude token generation due to external dependencies
  ],
  coverageThreshold: {
    global: { branches: 60, functions: 80, lines: 70, statements: 60 },
  },
};