module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.css$': 'identity-obj-proxy',
  },
  testResultsProcessor: 'jest-junit',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['js', 'jsx'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/cypress/',
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['clover'],
  coveragePathIgnorePatterns: [
    '/src/config.js',
    '/src/main.jsx',
    '/src/services/firebase.js', // Asegúrate de que esté aquí
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
  ],
};