module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/', '\\.integration\\.spec\\.ts$'],
  moduleNameMapper: {
    '^.+/generated/prisma/client$': '<rootDir>/../../libs/feature/src/testing/prisma-client.stub.ts',
  },
};
