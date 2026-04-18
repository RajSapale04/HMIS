export default {
  testEnvironment: 'node',
  transform: { '^.+\\.js$': 'babel-jest' },
  testMatch: ['**/tests/structural/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
  },
};